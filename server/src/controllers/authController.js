const pool = require('../services/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    const [users] = await pool.execute('SELECT * FROM users WHERE username = ? AND deleted_at IS NULL', [username]);
    if (!users.length) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const user = users[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, role: user.role, boarding_house_id: user.boarding_house_id }, process.env.JWT_SECRET, { expiresIn: '12h' });
    const { password: _, ...userData } = user;
    res.json({ token, user: userData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.studentLogin = (req, res) => {
  // TODO: Implement student login logic
  res.json({ message: 'Student login endpoint' });
};

exports.me = async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, username, role, boarding_house_id, created_at, updated_at FROM users WHERE id = ? AND deleted_at IS NULL',
      [req.user.id]
    );

    if (!users.length) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(users[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const changePassword = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { current_password, new_password } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!current_password || !new_password) {
      return res.status(400).json({
        message: 'Current password and new password are required',
        errors: {
          current_password: !current_password ? 'Current password is required' : null,
          new_password: !new_password ? 'New password is required' : null
        }
      });
    }

    // Get user's current password
    const [users] = await connection.query(
      'SELECT password FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(current_password, users[0].password);
    if (!isPasswordValid) {
      return res.status(400).json({
        message: 'Current password is incorrect',
        errors: {
          currentPassword: 'Current password is incorrect'
        }
      });
    }

    // Validate new password
    if (new_password.length < 8) {
      return res.status(400).json({
        message: 'New password must be at least 8 characters long',
        errors: {
          newPassword: 'Password must be at least 8 characters long'
        }
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Update password
    await connection.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, userId]
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error in changePassword:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
};

module.exports = {
  login: exports.login,
  studentLogin: exports.studentLogin,
  me: exports.me,
  changePassword: changePassword
}; 