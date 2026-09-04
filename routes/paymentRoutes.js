const express           = require('express');
const router            = express.Router();
const PaymentController = require('../controllers/paymentController');
const { verifyToken }   = require('../middleware/authMiddleware');
const { requireRole }   = require('../middleware/roleMiddleware');

// 1. Checkout standard craft product (CustomerCheckout)
router.post('/checkout/:craftId', verifyToken, PaymentController.checkoutCraft);

// 2. Bhangari Shop buys citizen scrap listing (BhangariToCitizen)
router.post('/purchase-scrap/:listingId', verifyToken, requireRole('BhangariShop'), PaymentController.purchaseCitizenScrap);

// 3. Bhangari Shop buys volunteer collected campaign waste (BhangariToVolunteer)
router.post('/purchase-campaign-waste/:registrationId', verifyToken, requireRole('BhangariShop'), PaymentController.purchaseCampaignWaste);

// 4. Get total centralized cleanup campaign fund balance
router.get('/campaign-fund', verifyToken, PaymentController.getCampaignFundBalance);

// 5. Get attended campaign registrations with waste collected for buying board
router.get('/attended-registrations', verifyToken, requireRole('BhangariShop'), PaymentController.getAttendedRegistrations);

// 6. Get logged-in user's full transaction history
router.get('/my', verifyToken, PaymentController.getMyTransactions);

module.exports = router;
