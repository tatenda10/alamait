const pool = require('../services/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username and password are required' 
      });
    }

    // Get user with their boarding house details
    const [users] = await pool.execute(`
      SELECT 
        u.*,
        bh.name as boarding_house_name,
        bh.location as boarding_house_location,
        bha.boarding_house_id
      FROM users u
      INNER JOIN boarding_house_admins bha ON u.id = bha.user_id
      INNER JOIN boarding_houses bh ON bha.boarding_house_id = bh.id
      WHERE u.username = ? 
      AND u.deleted_at IS NULL
      AND bha.deleted_at IS NULL
      AND bh.deleted_at IS NULL
    `, [username]);

    // Check if user exists
    if (!users.length) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    const user = users[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        id: user.id,
        boarding_house_id: user.boarding_house_id
      },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    // Remove sensitive data before sending response
    const { 
      password: _, 
      deleted_at: __, 
      created_at: ___, 
      updated_at: ____, 
      ...userData 
    } = user;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: userData
      }
    });

  } catch (err) {
    console.error('Boarding house login error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const [users] = await pool.execute(`
      SELECT 
        u.*,
        bh.name as boarding_house_name,
        bh.location as boarding_house_location,
        bha.boarding_house_id
      FROM users u
      INNER JOIN boarding_house_admins bha ON u.id = bha.user_id
      INNER JOIN boarding_houses bh ON bha.boarding_house_id = bh.id
      WHERE u.id = ? 
      AND u.deleted_at IS NULL
      AND bha.deleted_at IS NULL
      AND bh.deleted_at IS NULL
    `, [userId]);

    if (!users.length) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = users[0];

    // Remove sensitive data
    const { 
      password: _, 
      deleted_at: __, 
      created_at: ___, 
      updated_at: ____, 
      ...userData 
    } = user;

    res.json({
      success: true,
      data: userData
    });

  } catch (err) {
    console.error('Get boarding house profile error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    // Get user with boarding house validation
    const [users] = await pool.execute(`
      SELECT 
        u.*,
        bha.boarding_house_id
      FROM users u
      INNER JOIN boarding_house_admins bha ON u.id = bha.user_id
      WHERE u.id = ? 
      AND u.deleted_at IS NULL
      AND bha.deleted_at IS NULL
    `, [userId]);

    if (!users.length) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = users[0];

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await pool.execute(
      'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
      [hashedPassword, userId]
    );

    res.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (err) {
    console.error('Change boarding house password error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

exports.logout = async (req, res) => {
  // Since we're using JWT, we just send a success response
  // The client should remove the token
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
}; 