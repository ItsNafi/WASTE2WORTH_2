const express          = require('express');
const router           = express.Router();
const HeatmapController = require('../controllers/heatmapController');
const { verifyToken }  = require('../middleware/authMiddleware');
const { requireRole }  = require('../middleware/roleMiddleware');

// Accessible by Admin, Citizen, and Volunteer
router.get('/', verifyToken, requireRole('Admin', 'Citizen', 'Volunteer'), HeatmapController.getData);

module.exports = router;
