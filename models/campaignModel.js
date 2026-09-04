const pool = require('../config/db');

const CampaignModel = {
  async create({ title, date, boundaryZone, participantCap }) {
    const [result] = await pool.execute(
      'INSERT INTO CleanupCampaigns (title, date, boundaryZone, participantCap) VALUES (?, ?, ?, ?)',
      [title, date, boundaryZone, participantCap]
    );
    return result.insertId;
  },

  async findAll() {
    const [rows] = await pool.execute('SELECT * FROM CleanupCampaigns ORDER BY date DESC');
    return rows;
  },

  /**
   * Returns all campaigns with status dynamically computed from date vs today.
   * Overrides the stored status column for accurate front-end display.
   *   past date  (and not Cancelled) → 'Completed'
   *   today                          → 'Active'
   *   future date                    → 'Upcoming'
   */
  async findAllWithDynamicStatus() {
    const [rows] = await pool.execute(`
      SELECT *,
        CASE
          WHEN status = 'Cancelled' THEN 'Cancelled'
          WHEN DATE(date) < CURDATE() THEN 'Completed'
          WHEN DATE(date) = CURDATE() THEN 'Active'
          ELSE 'Upcoming'
        END AS status
      FROM CleanupCampaigns
      ORDER BY date DESC
    `);
    return rows;
  },

  async findActiveAndUpcoming() {
    // Uses dynamic date comparison — returns only today + future campaigns
    const [rows] = await pool.execute(`
      SELECT *,
        CASE
          WHEN DATE(date) = CURDATE() THEN 'Active'
          ELSE 'Upcoming'
        END AS status
      FROM CleanupCampaigns
      WHERE DATE(date) >= CURDATE()
        AND status != 'Cancelled'
      ORDER BY date ASC
    `);
    return rows;
  },

  /**
   * Aggregated stats for the Impact Dashboard.
   * Returns: totalCampaigns, completedCampaigns, activeCampaigns,
   *          upcomingCampaigns, totalWasteKg, totalPointsAwarded, totalAttendance
   */
  async getImpactStats() {
    const [[campaignStats]] = await pool.execute(`
      SELECT
        COUNT(*) AS totalCampaigns,
        SUM(CASE WHEN DATE(date) < CURDATE() AND status != 'Cancelled' THEN 1 ELSE 0 END) AS completedCampaigns,
        SUM(CASE WHEN DATE(date) = CURDATE() AND status != 'Cancelled' THEN 1 ELSE 0 END) AS activeCampaigns,
        SUM(CASE WHEN DATE(date) > CURDATE() AND status != 'Cancelled' THEN 1 ELSE 0 END) AS upcomingCampaigns,
        COALESCE(SUM(currentVolunteers), 0)  AS totalVolunteerSlotsFilled,
        COALESCE(SUM(participantCap), 0)     AS totalParticipantCap
      FROM CleanupCampaigns
    `);

    const [[wasteStats]] = await pool.execute(`
      SELECT COALESCE(SUM(wasteCollectedKg), 0) AS totalWasteKg
      FROM CampaignRegistrations
      WHERE wasteCollectedKg IS NOT NULL
    `);

    const [[pointStats]] = await pool.execute(`
      SELECT
        COALESCE(SUM(points_awarded), 0) AS totalPointsAwarded,
        COUNT(*) AS totalAttendance
      FROM campaign_attendance
    `);

    return {
      totalCampaigns:          campaignStats.totalCampaigns,
      completedCampaigns:      campaignStats.completedCampaigns,
      activeCampaigns:         campaignStats.activeCampaigns,
      upcomingCampaigns:       campaignStats.upcomingCampaigns,
      totalVolunteerSlotsFilled: campaignStats.totalVolunteerSlotsFilled,
      totalParticipantCap:     campaignStats.totalParticipantCap,
      totalWasteKg:            parseFloat(wasteStats.totalWasteKg),
      totalPointsAwarded:      pointStats.totalPointsAwarded,
      totalAttendance:         pointStats.totalAttendance,
    };
  },

  async registerVolunteer(campaignId, volunteerId) {
    await pool.execute(
      'INSERT INTO CampaignRegistrations (campaignId, volunteerId) VALUES (?, ?)',
      [campaignId, volunteerId]
    );
    await pool.execute('UPDATE CleanupCampaigns SET currentVolunteers = currentVolunteers + 1 WHERE campaignId = ?', [campaignId]);
  },

  async checkRegistration(campaignId, volunteerId) {
    const [rows] = await pool.execute(
      'SELECT * FROM CampaignRegistrations WHERE campaignId = ? AND volunteerId = ?',
      [campaignId, volunteerId]
    );
    return rows.length > 0;
  },

  async logAttendanceAndWaste(campaignId, volunteerId, wasteCollectedKg) {
    await pool.execute(
      "UPDATE CampaignRegistrations SET status = 'Attended', wasteCollectedKg = ? WHERE campaignId = ? AND volunteerId = ?",
      [wasteCollectedKg, campaignId, volunteerId]
    );
  },

  async findRegistrationById(registrationId) {
    const [rows] = await pool.execute(
      `SELECT cr.*, cc.title AS campaignTitle 
       FROM CampaignRegistrations cr
       JOIN CleanupCampaigns cc ON cr.campaignId = cc.campaignId
       WHERE cr.registrationId = ?`,
      [registrationId]
    );
    return rows[0] || null;
  },

  async findAttendedRegistrations() {
    const [rows] = await pool.execute(
      `SELECT cr.*, cc.title AS campaignTitle, u.name AS volunteerName 
       FROM CampaignRegistrations cr
       JOIN CleanupCampaigns cc ON cr.campaignId = cc.campaignId
       JOIN Users u ON cr.volunteerId = u.id
       WHERE cr.status = 'Attended'
       ORDER BY cr.registeredAt DESC`
    );
    return rows;
  }
};

module.exports = CampaignModel;
