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

    // Get user with their petty cash account details
    const [users] = await pool.execute(`
      SELECT 
        pcu.*,
        pca.id as petty_cash_account_id,
        pca.account_name,
        pca.account_code,
        pca.current_balance,
        pca.status as account_status,
        bh.name as boarding_house_name,
        bh.location as boarding_house_location,
        pca.boarding_house_id
      FROM petty_cash_users pcu
      INNER JOIN petty_cash_accounts pca ON pcu.id = pca.petty_cash_user_id
      INNER JOIN boarding_houses bh ON pca.boarding_house_id = bh.id
      WHERE pcu.username = ? 
      AND pcu.deleted_at IS NULL
      AND pca.deleted_at IS NULL
      AND pca.status = 'active'
      AND bh.deleted_at IS NULL
    `, [username]);

    // Check if user exists
    if (!users.length) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials or no active petty cash account' 
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

    // Create JWT token specifically for petty cash users
    const token = jwt.sign(
      { 
        id: user.id,
        username: user.username,
        role: 'petty_cash_user',
        petty_cash_account_id: user.petty_cash_account_id,
        boarding_house_id: user.boarding_house_id,
        boarding_house_name: user.boarding_house_name
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
    console.error('Petty cash login error:', err);
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
        pcu.*,
        pca.id as petty_cash_account_id,
        pca.account_name,
        pca.account_code,
        pca.current_balance,
        pca.status as account_status,
        bh.name as boarding_house_name,
        bh.location as boarding_house_location,
        pca.boarding_house_id
      FROM petty_cash_users pcu
      INNER JOIN petty_cash_accounts pca ON pcu.id = pca.petty_cash_user_id
      INNER JOIN boarding_houses bh ON pca.boarding_house_id = bh.id
      WHERE pcu.id = ? 
      AND pcu.deleted_at IS NULL
      AND pca.deleted_at IS NULL
      AND pca.status = 'active'
      AND bh.deleted_at IS NULL
    `, [userId]);

    if (!users.length) {
      return res.status(404).json({
        success: false,
        message: 'User not found or no active petty cash account'
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
    console.error('Get petty cash profile error:', err);
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

    // Get user
    const [users] = await pool.execute(
      'SELECT * FROM petty_cash_users WHERE id = ? AND deleted_at IS NULL',
      [userId]
    );

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
      'UPDATE petty_cash_users SET password = ?, updated_at = NOW() WHERE id = ?',
      [hashedPassword, userId]
    );

    res.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (err) {
    console.error('Change petty cash password error:', err);
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
