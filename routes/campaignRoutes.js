const express = require('express');
const router = express.Router();
const CampaignController = require('../controllers/campaignController');
const { verifyToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

router.get('/', verifyToken, CampaignController.getCampaigns);
router.post('/:campaignId/register', verifyToken, requireRole('Volunteer', 'Citizen', 'Admin'), CampaignController.registerForCampaign);
module.exports = router;
