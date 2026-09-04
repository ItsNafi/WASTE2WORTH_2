const ScrapModel = require('../models/scrapModel');
const PaymentController = require('./paymentController');

const BhangariController = {
  /** Fetch all scrap listings for the buying board. */
  async getBoard(_req, res) {
    try {
      const listings = await ScrapModel.findAll();
      res.json(listings);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch board data' });
    }
  },

  /** Bhangari shop purchases a scrap listing — delegates to atomic PaymentController */
  async purchaseScrap(req, res) {
    return PaymentController.purchaseCitizenScrap(req, res);
  }
};

module.exports = BhangariController;
