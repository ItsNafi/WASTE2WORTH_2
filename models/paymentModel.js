const pool = require('../config/db');

const PaymentModel = {
  /** Record a payment transaction (supports optional transaction connection) */
  async create({ senderId, receiverId, amount, type, referenceId, status = 'Completed' }, connection = null) {
    const db = connection || pool;
    const [result] = await db.execute(
      'INSERT INTO Payments (senderId, receiverId, amount, type, referenceId, status) VALUES (?, ?, ?, ?, ?, ?)',
      [senderId, receiverId || null, amount, type, referenceId, status]
    );
    return {
      paymentId: result.insertId,
      senderId,
      receiverId: receiverId || null,
      amount,
      type,
      referenceId,
      status
    };
  },

  /** Get payments by sender ID */
  async findBySender(senderId) {
    const [rows] = await pool.execute(
      'SELECT * FROM Payments WHERE senderId = ? ORDER BY createdAt DESC',
      [senderId]
    );
    return rows;
  },

  /** Get payments by receiver ID */
  async findByReceiver(receiverId) {
    const [rows] = await pool.execute(
      'SELECT * FROM Payments WHERE receiverId = ? ORDER BY createdAt DESC',
      [receiverId]
    );
    return rows;
  },

  /** Calculate campaign fund balance dynamically (Bhangari to Volunteer payments) */
  async getCampaignFundBalance() {
    const [rows] = await pool.execute(
      "SELECT SUM(amount) AS balance FROM Payments WHERE type = 'BhangariToVolunteer'"
    );
    return parseFloat(rows[0].balance || 0).toFixed(2);
  },

  /** Get full payment history for a user (as sender or receiver) with names */
  async findByUser(userId) {
    const [rows] = await pool.execute(
      `SELECT p.*,
              s.name AS senderName,
              COALESCE(r.name, 'Cleanup Campaign Fund') AS receiverName
       FROM Payments p
       LEFT JOIN Users s ON p.senderId = s.id
       LEFT JOIN Users r ON p.receiverId = r.id
       WHERE p.senderId = ? OR p.receiverId = ?
       ORDER BY p.createdAt DESC`,
      [userId, userId]
    );
    return rows;
  },

  /** Check if campaign registration waste has already been settled/purchased */
  async findByRegistration(registrationId) {
    const [rows] = await pool.execute(
      "SELECT * FROM Payments WHERE type = 'BhangariToVolunteer' AND referenceId = ?",
      [registrationId]
    );
    return rows[0] || null;
  },

  /** Get total profit for a creator from CustomerCheckout payments */
  async getCreatorProfit(creatorId) {
    const [rows] = await pool.execute(
      "SELECT SUM(amount) AS totalProfit FROM Payments WHERE receiverId = ? AND type = 'CustomerCheckout'",
      [creatorId]
    );
    return parseFloat(rows[0].totalProfit || 0).toFixed(2);
  },

  /** Get sales history for a creator (who bought from them and what) */
  async getCreatorSales(creatorId) {
    const [rows] = await pool.execute(
      `SELECT p.*,
              s.name AS buyerName,
              s.email AS buyerEmail,
              c.title AS craftTitle
       FROM Payments p
       JOIN Users s ON p.senderId = s.id
       LEFT JOIN UpcycledCrafts c ON p.referenceId = c.craftId
       WHERE p.receiverId = ? AND p.type = 'CustomerCheckout'
       ORDER BY p.createdAt DESC`,
      [creatorId]
    );
    return rows;
  }
};

module.exports = PaymentModel;
