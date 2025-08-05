const jwt = require('jsonwebtoken');
const db = require('../services/db');

const authenticatePettyCashUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'pettycash_user') {
      return res.status(401).json({ message: 'Invalid token type' });
    }

    // Get user data from database
    const [users] = await db.query(
      'SELECT id, username, full_name, email, status FROM petty_cash_users WHERE id = ? AND status = ?',
      [decoded.id, 'active']
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    req.user = users[0];
    next();

  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = { authenticatePettyCashUser };