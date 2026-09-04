const QRCode = require('qrcode');
const jwt = require('jsonwebtoken');
const db = require('../config/db'); // Assuming mysql2 pool
const { awardGreenPoints } = require('../utils/greenScoreEngine');

const JWT_SECRET = process.env.JWT_SECRET || 'waste2worth_super_secret_key';
const POINTS_PER_ATTENDANCE = 50;

/**
 * Generate a QR code for a specific campaign.
 * Endpoint: GET /api/campaigns/:id/qr-code
 */
exports.generateQR = async (req, res) => {
    try {
        const campaignId = req.params.id;

        // Check if campaign exists
        const [campaigns] = await db.query('SELECT * FROM CleanupCampaigns WHERE campaignId = ?', [campaignId]);
        if (campaigns.length === 0) {
            return res.status(404).json({ error: 'Campaign not found' });
        }
        const campaignDate = new Date(campaigns[0].date);
        const endOfCampaignDay = new Date(campaignDate);
        endOfCampaignDay.setHours(23, 59, 59, 999);
        if (endOfCampaignDay < new Date()) {
            return res.status(400).json({ error: 'Cannot generate QR code: This campaign has already ended.' });
        }

        // Create a signed payload for the QR code
        // We include the campaignId and an expiry (e.g., 24 hours) to prevent old QR codes from being used
        const payload = { campaignId };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

        // Generate the Base64 Data URL for the QR code image
        const qrDataURL = await QRCode.toDataURL(token);

        return res.status(200).json({
            message: 'QR Code generated successfully',
            qrImage: qrDataURL,
            campaignId,
            token
        });
    } catch (error) {
        console.error('Error generating QR code:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * Scan a QR code and record attendance.
 * Endpoint: POST /api/attendance/scan
 * Body expected: { token: string, volunteerId: number }
 */
exports.scanAttendance = async (req, res) => {
    try {
        const { token, volunteerId, campaignId: selectedCampaignId } = req.body;

        if (!token || !volunteerId || !selectedCampaignId) {
            return res.status(400).json({ error: 'Token, volunteerId, and campaignId are required.' });
        }

        // Verify the QR token
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            return res.status(400).json({ error: 'Invalid or expired QR code.' });
        }

        const campaignId = parseInt(decoded.campaignId, 10);

        if (campaignId !== parseInt(selectedCampaignId, 10)) {
            return res.status(400).json({ error: 'Invalid QR Code for the selected campaign.' });
        }

        // Check if the campaign has already ended
        const [campaigns] = await db.query('SELECT * FROM CleanupCampaigns WHERE campaignId = ?', [campaignId]);
        if (campaigns.length === 0) {
            return res.status(404).json({ error: 'Campaign not found.' });
        }
        const campaignDate = new Date(campaigns[0].date);
        const endOfCampaignDay = new Date(campaignDate);
        endOfCampaignDay.setHours(23, 59, 59, 999);
        if (endOfCampaignDay < new Date()) {
            return res.status(400).json({ error: "This campaign has already ended." });
        }

        // Map volunteerId (profile ID) to actual Users.id if it matches a profile ID
        let userId = volunteerId;
        const [volProfile] = await db.query(
            'SELECT userId FROM VolunteerProfiles WHERE id = ? OR userId = ?',
            [volunteerId, volunteerId]
        );
        if (volProfile.length > 0) {
            userId = volProfile[0].userId;
        }

        const [registrations] = await db.query(
            'SELECT * FROM CampaignRegistrations WHERE campaignId = ? AND volunteerId = ?',
            [campaignId, userId]
        );

        // If volunteer wasn't pre-registered, auto-register them on-site; otherwise mark as Attended
        if (registrations.length === 0) {
            await db.query(
                'INSERT INTO CampaignRegistrations (campaignId, volunteerId, status) VALUES (?, ?, ?)',
                [campaignId, userId, 'Attended']
            );
            await db.query('UPDATE CleanupCampaigns SET currentVolunteers = currentVolunteers + 1 WHERE campaignId = ?', [campaignId]);
        } else {
            await db.query(
                "UPDATE CampaignRegistrations SET status = 'Attended' WHERE campaignId = ? AND volunteerId = ?",
                [campaignId, userId]
            );
        }

        // Determine hours attended (custom override or default to campaign duration)
        let finalHours = req.body.hoursAttended !== undefined && req.body.hoursAttended !== null
            ? parseFloat(req.body.hoursAttended)
            : null;
        if (finalHours === null || isNaN(finalHours)) {
            finalHours = campaigns[0].durationHours !== null ? parseFloat(campaigns[0].durationHours) : 3.0;
        }

        // Deduplication: Try to insert attendance record.
        // The unique constraint (campaign_id, volunteer_id) will throw ER_DUP_ENTRY if already scanned.
        try {
            await db.query(
                `INSERT INTO campaign_attendance (campaign_id, volunteer_id, points_awarded, hoursAttended) 
                 VALUES (?, ?, ?, ?)`,
                [campaignId, userId, POINTS_PER_ATTENDANCE, finalHours]
            );
        } catch (dbError) {
            if (dbError.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ error: 'Attendance already recorded for this campaign.' });
            }
            throw dbError; // re-throw if it's a different error
        }

        // Trigger Green Score Engine to award points atomically
        await awardGreenPoints(userId, POINTS_PER_ATTENDANCE, 'CAMPAIGN_ATTENDANCE', campaignId);

        return res.status(200).json({
            message: 'Attendance recorded successfully!',
            pointsAwarded: POINTS_PER_ATTENDANCE,
            campaignId
        });
    } catch (error) {
        console.error('Error scanning attendance:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};
