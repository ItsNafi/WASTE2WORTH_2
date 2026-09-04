const CampaignModel = require('../models/campaignModel');
const PollutionModel = require('../models/pollutionModel');
const PriceDirectoryModel = require('../models/priceDirectoryModel');
const PaymentGateway = require('../utils/paymentGateway'); // Used if admin processes mock payouts

const AdminController = {
  async getDashboardData(req, res) {
    try {
      const campaigns = await CampaignModel.findAll();
      const complaints = await PollutionModel.findAll();
      const prices = await PriceDirectoryModel.getAllPrices();
      
      res.json({ campaigns, complaints, prices });
    } catch (err) {
      res.status(500).json({ error: 'Failed to load dashboard data' });
    }
  },

  async createCampaign(req, res) {
    try {
      const { title, date, boundaryZone, participantCap } = req.body;
      if (!title || !date || !boundaryZone || !participantCap) {
        return res.status(400).json({ error: 'All fields are required' });
      }
      
      await CampaignModel.create({ title, date, boundaryZone, participantCap });
      res.status(201).json({ message: 'Campaign created successfully' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to create campaign' });
    }
  },

  async updatePrice(req, res) {
    try {
      const { categoryId } = req.params;
      const { pricePerKg } = req.body;
      
      if (!pricePerKg) return res.status(400).json({ error: 'Price is required' });
      
      await PriceDirectoryModel.updatePrice(categoryId, pricePerKg);
      res.json({ message: 'Price updated successfully' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update price' });
    }
  },
  
  async processMockDonation(req, res) {
    try {
      const { bhangariId, campaignId, amount } = req.body;
      const result = await PaymentGateway.processBhangariToCampaignFund(bhangariId, campaignId, amount);
      res.json({ message: 'Donation processed successfully', transactionId: result.transactionId });
    } catch(err) {
      res.status(500).json({ error: 'Payment failed' });
    }
  },

  /**
   * GET /api/admin/impact-stats
   * Returns aggregated KPIs for the Impact Dashboard.
   */
  async getImpactStats(req, res) {
    try {
      const stats = await CampaignModel.getImpactStats();
      res.json(stats);
    } catch (err) {
      console.error('getImpactStats error:', err);
      res.status(500).json({ error: 'Failed to load impact stats.' });
    }
  },

  /**
   * GET /api/admin/top-volunteers
   * Returns top 10 volunteers ranked by greenPoints from Users table,
   * joined with campaign attendance count.
   */
  async getTopVolunteers(req, res) {
    try {
      const db = require('../config/db');
      const [rows] = await db.execute(`
        SELECT
          u.id,
          u.name         AS volunteerName,
          u.email,
          u.greenPoints,
          COALESCE(att.campaignsAttended, 0) AS campaignsAttended
        FROM Users u
        LEFT JOIN (
          SELECT volunteer_id, COUNT(*) AS campaignsAttended
          FROM campaign_attendance
          GROUP BY volunteer_id
        ) att ON att.volunteer_id = u.id
        WHERE u.role = 'Volunteer'
        ORDER BY u.greenPoints DESC
        LIMIT 10
      `);
      res.json(rows);
    } catch (err) {
      console.error('getTopVolunteers error:', err);
      res.status(500).json({ error: 'Failed to load top volunteers.' });
    }
  }
};

module.exports = AdminController;
