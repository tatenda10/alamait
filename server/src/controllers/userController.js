const pool = require('../services/db');
const bcrypt = require('bcrypt');

exports.createUser = async (req, res) => {
  try {
    const { username, role, email, password, national_id, gender, address, phone_number } = req.body;
    if (!username || !role || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      `INSERT INTO users (username, role, email, password, national_id, gender, address, phone_number, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [username, role, email, hashedPassword, national_id, gender, address, phone_number]
    );
    const [user] = await pool.execute('SELECT id, username, role, email, national_id, gender, address, phone_number, boarding_house_id, created_at FROM users WHERE id = ?', [result.insertId]);
    res.status(201).json(user[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.listUsers = async (req, res) => {
  try {
    const { role, unassigned } = req.query;
    
    let query = 'SELECT id, username, role, email, national_id, gender, address, phone_number, boarding_house_id, created_at FROM users WHERE deleted_at IS NULL';
    const params = [];
    
    // Filter by role if specified
    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }
    
    // Only apply unassigned filter if explicitly requested and not getting all admins
    if (unassigned === 'true' && role !== 'admin') {
      query += ' AND id NOT IN (SELECT user_id FROM boarding_house_admins WHERE deleted_at IS NULL)';
    }
    
    query += ' ORDER BY username';
    
    const [users] = await pool.execute(query, params);
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, role, email, national_id, gender, address, phone_number } = req.body;

    // Validate required fields
    if (!username || !role || !email) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if user exists
    const [existingUser] = await pool.execute(
      'SELECT id FROM users WHERE id = ? AND deleted_at IS NULL',
      [id]
    );

    if (existingUser.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user
    await pool.execute(
      `UPDATE users 
       SET username = ?, role = ?, email = ?, national_id = ?, 
           gender = ?, address = ?, phone_number = ?
       WHERE id = ?`,
      [username, role, email, national_id, gender, address, phone_number, id]
    );

    // Fetch updated user
    const [updatedUser] = await pool.execute(
      'SELECT id, username, role, email, national_id, gender, address, phone_number, boarding_house_id, created_at FROM users WHERE id = ?',
      [id]
    );

    res.json(updatedUser[0]);
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Username or email already exists' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists and is not already deleted, and get their role and username
    const [existingUser] = await pool.execute(
      'SELECT id, role, username FROM users WHERE id = ? AND deleted_at IS NULL',
      [id]
    );

    if (existingUser.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deletion of super_admin users
    if (existingUser[0].role === 'super_admin') {
      return res.status(403).json({ message: 'Cannot delete super admin users' });
    }

    // Prevent deletion of users with username 'sysadmin'
    if (existingUser[0].username === 'sysadmin') {
      return res.status(403).json({ message: 'Cannot delete sysadmin user' });
    }

    // Soft delete user
    const [result] = await pool.execute(
      'UPDATE users SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};