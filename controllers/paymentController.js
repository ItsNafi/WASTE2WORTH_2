const pool = require('../config/db');
const PaymentModel = require('../models/paymentModel');
const CraftModel = require('../models/craftModel');
const CampaignModel = require('../models/campaignModel');
const UserModel = require('../models/userModel');
const PriceDirectoryModel = require('../models/priceDirectoryModel');
const NotificationModel = require('../models/notificationModel');
const PaymentGateway = require('../utils/paymentGateway');

const PaymentController = {
  /** 1. Process typical consumer checkout for an upcycled craft (CustomerCheckout) */
  async checkoutCraft(req, res) {
    const connection = await pool.getConnection();
    try {
      const { craftId } = req.params;
      const customerId = req.user.id;

      await connection.beginTransaction();

      const [crafts] = await connection.execute(
        'SELECT * FROM UpcycledCrafts WHERE craftId = ? FOR UPDATE',
        [craftId]
      );
      const craft = crafts[0];

      if (!craft) {
        await connection.rollback();
        return res.status(404).json({ error: 'Craft product not found' });
      }

      if (craft.creatorId === customerId) {
        await connection.rollback();
        return res.status(400).json({ error: 'You cannot purchase your own product' });
      }

      if (craft.inventoryCount <= 0) {
        await connection.rollback();
        return res.status(400).json({ error: 'This craft is out of stock' });
      }

      // Atomic conditional update to prevent race conditions & double purchase
      const [updateResult] = await connection.execute(
        'UPDATE UpcycledCrafts SET inventoryCount = inventoryCount - 1 WHERE craftId = ? AND inventoryCount > 0',
        [craftId]
      );

      if (updateResult.affectedRows === 0) {
        await connection.rollback();
        return res.status(409).json({ error: 'Craft is out of stock or was just purchased by another customer' });
      }

      // Simulate payment processing via PaymentGateway engine
      await PaymentGateway.processCustomerToCreator(customerId, craft.creatorId, craft.price);

      // Award Green Points (Buyer: +10 points, Creator: +15 points)
      await connection.execute('UPDATE Users SET greenPoints = greenPoints + 10 WHERE id = ?', [customerId]);
      await connection.execute('UPDATE Users SET greenPoints = greenPoints + 15 WHERE id = ?', [craft.creatorId]);

      // Record atomic Payment transaction
      const payment = await PaymentModel.create(
        {
          senderId: customerId,
          receiverId: craft.creatorId,
          amount: craft.price,
          type: 'CustomerCheckout',
          referenceId: craftId,
          status: 'Completed'
        },
        connection
      );

      // Send notification to creator
      const [buyerRows] = await connection.execute('SELECT name FROM Users WHERE id = ?', [customerId]);
      const buyerName = buyerRows[0] ? buyerRows[0].name : 'A customer';

      await connection.execute(
        'INSERT INTO Notifications (userId, message) VALUES (?, ?)',
        [
          craft.creatorId,
          `Payment received: ${buyerName} purchased your product "${craft.title}" for $${parseFloat(craft.price).toFixed(2)}.`
        ]
      );

      await connection.commit();

      res.status(201).json({
        message: 'Checkout completed successfully! Thank you for supporting local artisans.',
        payment
      });
    } catch (err) {
      await connection.rollback();
      console.error('Checkout error:', err);
      res.status(500).json({ error: 'Failed to process checkout transaction' });
    } finally {
      connection.release();
    }
  },

  /** 2. Process Bhangari Shop buying citizen scrap listing (BhangariToCitizen) */
  async purchaseCitizenScrap(req, res) {
    const connection = await pool.getConnection();
    try {
      const { listingId } = req.params;
      const bhangariId = req.user.id;

      await connection.beginTransaction();

      // Lock row for update
      const [listings] = await connection.execute(
        'SELECT s.*, u.name AS ownerName FROM ScrapListings s JOIN Users u ON s.ownerId = u.id WHERE s.listingId = ? FOR UPDATE',
        [listingId]
      );
      const listing = listings[0];

      if (!listing) {
        await connection.rollback();
        return res.status(404).json({ error: 'Scrap listing not found' });
      }

      if (listing.status !== 'Available') {
        await connection.rollback();
        return res.status(409).json({ error: 'This scrap listing is no longer available or was already purchased' });
      }

      if (listing.ownerId === bhangariId) {
        await connection.rollback();
        return res.status(400).json({ error: 'You cannot purchase your own scrap listing' });
      }

      // Calculate transaction amount using PriceDirectory (Server-side dynamic pricing)
      const pricePerKg = await PriceDirectoryModel.getPriceByCategory(listing.category);
      const amount = parseFloat((parseFloat(listing.weight) * pricePerKg).toFixed(2)) || 0.00;

      // Atomic conditional update to prevent race conditions & double purchases
      const [updateResult] = await connection.execute(
        "UPDATE ScrapListings SET status = 'Sold' WHERE listingId = ? AND status = 'Available'",
        [listingId]
      );

      if (updateResult.affectedRows === 0) {
        await connection.rollback();
        return res.status(409).json({ error: 'Item already purchased or unavailable' });
      }

      // Simulate payment processing via PaymentGateway engine
      await PaymentGateway.processBhangariToCitizen(bhangariId, listing.ownerId, amount);

      // Award Green Points (Citizen seller: +20 points, Bhangari buyer: +15 points)
      await connection.execute('UPDATE Users SET greenPoints = greenPoints + 20 WHERE id = ?', [listing.ownerId]);
      await connection.execute('UPDATE Users SET greenPoints = greenPoints + 15 WHERE id = ?', [bhangariId]);

      // Record atomic Payment transaction
      const payment = await PaymentModel.create(
        {
          senderId: bhangariId,
          receiverId: listing.ownerId,
          amount,
          type: 'BhangariToCitizen',
          referenceId: listingId,
          status: 'Completed'
        },
        connection
      );

      // Send notification to citizen seller inside transaction
      const [bhangariRows] = await connection.execute('SELECT name FROM Users WHERE id = ?', [bhangariId]);
      const bhangariName = bhangariRows[0] ? bhangariRows[0].name : 'A buyer';

      await connection.execute(
        'INSERT INTO Notifications (userId, message) VALUES (?, ?)',
        [
          listing.ownerId,
          `Payment received: ${bhangariName} purchased your ${listing.category} scrap listing (${listing.weight} kg @ $${pricePerKg.toFixed(2)}/kg) for $${amount.toFixed(2)}.`
        ]
      );

      await connection.commit();

      res.status(200).json({
        message: `Scrap purchased successfully for $${amount.toFixed(2)}! +15 Green Points earned.`,
        payment,
        unitPrice: pricePerKg,
        totalAmount: amount
      });
    } catch (err) {
      await connection.rollback();
      console.error('Purchase citizen scrap error:', err);
      res.status(500).json({ error: 'Failed to complete scrap purchase transaction' });
    } finally {
      connection.release();
    }
  },

  /** 3. Process Bhangari Shop buying volunteer campaign waste (BhangariToVolunteer) */
  async purchaseCampaignWaste(req, res) {
    const connection = await pool.getConnection();
    try {
      const { registrationId } = req.params;
      const { category } = req.body;
      const bhangariId = req.user.id;

      if (!category) {
        return res.status(400).json({ error: 'Waste category is required for pricing' });
      }

      await connection.beginTransaction();

      const [registrations] = await connection.execute(
        'SELECT * FROM CampaignRegistrations WHERE registrationId = ? FOR UPDATE',
        [registrationId]
      );
      const registration = registrations[0];

      if (!registration) {
        await connection.rollback();
        return res.status(404).json({ error: 'Campaign registration record not found' });
      }

      if (registration.status !== 'Attended') {
        await connection.rollback();
        return res.status(400).json({ error: 'Volunteer must have attended the campaign to sell collected waste' });
      }

      if (parseFloat(registration.wasteCollectedKg) <= 0) {
        await connection.rollback();
        return res.status(400).json({ error: 'No waste was collected for this registration' });
      }

      // Check if registration waste was already purchased
      const [existingPayments] = await connection.execute(
        "SELECT * FROM Payments WHERE type = 'BhangariToVolunteer' AND referenceId = ?",
        [registrationId]
      );
      if (existingPayments.length > 0) {
        await connection.rollback();
        return res.status(409).json({ error: 'Waste for this campaign registration has already been purchased' });
      }

      // Server-side dynamic pricing calculation via PriceDirectory
      const pricePerKg = await PriceDirectoryModel.getPriceByCategory(category);
      const amount = parseFloat((parseFloat(registration.wasteCollectedKg) * pricePerKg).toFixed(2)) || 0.00;

      // Simulate payment processing via PaymentGateway engine
      await PaymentGateway.processBhangariToCampaignFund(bhangariId, registration.campaignId, amount);

      // Award Green Points (Bhangari: +20 points, Volunteer: +10 points)
      await connection.execute('UPDATE Users SET greenPoints = greenPoints + 20 WHERE id = ?', [bhangariId]);
      await connection.execute('UPDATE Users SET greenPoints = greenPoints + 10 WHERE id = ?', [registration.volunteerId]);

      // Record atomic Payment transaction
      const payment = await PaymentModel.create(
        {
          senderId: bhangariId,
          receiverId: registration.volunteerId,
          amount,
          type: 'BhangariToVolunteer',
          referenceId: registrationId,
          status: 'Completed'
        },
        connection
      );

      // Send notification to volunteer
      const [bhangariRows] = await connection.execute('SELECT name FROM Users WHERE id = ?', [bhangariId]);
      const bhangariName = bhangariRows[0] ? bhangariRows[0].name : 'A buyer';

      await connection.execute(
        'INSERT INTO Notifications (userId, message) VALUES (?, ?)',
        [
          registration.volunteerId,
          `Payment received: ${bhangariName} purchased your collected campaign waste (${registration.wasteCollectedKg} kg of ${category} @ $${pricePerKg.toFixed(2)}/kg) for $${amount.toFixed(2)}.`
        ]
      );

      await connection.commit();

      res.status(201).json({
        message: `Waste purchased successfully! $${amount.toFixed(2)} has been routed to the Cleanup Campaign Fund & Volunteer earnings.`,
        payment,
        unitPrice: pricePerKg,
        totalAmount: amount
      });
    } catch (err) {
      await connection.rollback();
      console.error('Purchase campaign waste error:', err);
      res.status(500).json({ error: 'Failed to purchase campaign waste' });
    } finally {
      connection.release();
    }
  },

  /** 4. Fetch the Centralized Cleanup Campaign Fund balance */
  async getCampaignFundBalance(req, res) {
    try {
      const balance = await PaymentModel.getCampaignFundBalance();
      res.json({ balance });
    } catch (err) {
      res.status(500).json({ error: 'Failed to retrieve campaign fund balance' });
    }
  },

  /** 5. Retrieve all attended registrations with waste collected for buying board */
  async getAttendedRegistrations(req, res) {
    try {
      const registrations = await CampaignModel.findAttendedRegistrations();
      res.json(registrations);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch attended campaign registrations' });
    }
  },

  /** 6. Retrieve the logged-in user's full transaction history */
  async getMyTransactions(req, res) {
    try {
      const transactions = await PaymentModel.findByUser(req.user.id);
      res.json(transactions);
    } catch (err) {
      console.error('My transactions error:', err);
      res.status(500).json({ error: 'Failed to fetch transaction history' });
    }
  }
};

module.exports = PaymentController;
