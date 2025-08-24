const pool = require('../services/db');

exports.createBoardingHouse = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { name, location, admin_user_id } = req.body;
    console.log(req.body)
    created_by_user_id=1
    if (!name || !location || !admin_user_id ) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Check if user exists (removed admin role requirement)
    const [users] = await connection.execute(
      'SELECT * FROM users WHERE id = ? AND deleted_at IS NULL',
      [admin_user_id]
    );
    if (!users.length) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get created_by from request body instead of req.user.id
    const created_by = created_by_user_id;
    const [result] = await connection.execute(
      `INSERT INTO boarding_houses (name, location, created_by, created_at) VALUES (?, ?, ?, NOW())`,
      [name, location, created_by]
    );
    const boarding_house_id = result.insertId;

    // Create entry in boarding_house_admins table
    await connection.execute(
      'INSERT INTO boarding_house_admins (boarding_house_id, user_id, created_at) VALUES (?, ?, NOW())',
      [boarding_house_id, admin_user_id]
    );

    // Create predefined chart of accounts for the new boarding house
    await createPredefinedChartOfAccounts(connection, boarding_house_id, created_by);

    await connection.commit();

    // Fetch the created boarding house with admin info
    const [house] = await connection.execute(`
      SELECT bh.*, 
             GROUP_CONCAT(u.username) as admin_names,
             GROUP_CONCAT(u.id) as admin_ids
      FROM boarding_houses bh
      LEFT JOIN boarding_house_admins bha ON bh.id = bha.boarding_house_id
      LEFT JOIN users u ON bha.user_id = u.id
      WHERE bh.id = ?
      GROUP BY bh.id
    `, [boarding_house_id]);

    res.status(201).json(house[0]);
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
};

exports.updateBoardingHouse = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location, admin_user_id } = req.body;

    if (!name || !location || !admin_user_id) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if boarding house exists
    const [houses] = await pool.execute(
      'SELECT * FROM boarding_houses WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    if (!houses.length) {
      return res.status(404).json({ message: 'Boarding house not found' });
    }

    // Check if new admin exists and has admin role
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE id = ? AND role = ? AND deleted_at IS NULL',
      [admin_user_id, 'admin']
    );
    if (!users.length) {
      return res.status(404).json({ message: 'Admin user not found or user is not an admin' });
    }

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Update boarding house details
      await connection.execute(
        'UPDATE boarding_houses SET name = ?, location = ?, updated_at = NOW() WHERE id = ?',
        [name, location, id]
      );

      // Update admin assignment
      await connection.execute(
        'UPDATE boarding_house_admins SET deleted_at = NOW() WHERE boarding_house_id = ? AND deleted_at IS NULL',
        [id]
      );
      await connection.execute(
        'INSERT INTO boarding_house_admins (boarding_house_id, user_id, created_at) VALUES (?, ?, NOW())',
        [id, admin_user_id]
      );

      await connection.commit();

      // Fetch updated boarding house with admin info
      const [house] = await pool.execute(`
        SELECT bh.*, 
               GROUP_CONCAT(u.username) as admin_names,
               GROUP_CONCAT(u.id) as admin_ids
        FROM boarding_houses bh
        LEFT JOIN boarding_house_admins bha ON bh.id = bha.boarding_house_id
        LEFT JOIN users u ON bha.user_id = u.id
        WHERE bh.id = ?
        GROUP BY bh.id
      `, [id]);

      res.json(house[0]);
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.listBoardingHouses = async (req, res) => {
  try {
    // Fetch boarding houses with their admin information
    const [houses] = await pool.execute(`
      SELECT bh.*, 
             GROUP_CONCAT(u.username) as admin_names,
             GROUP_CONCAT(u.id) as admin_ids
      FROM boarding_houses bh
      LEFT JOIN boarding_house_admins bha ON bh.id = bha.boarding_house_id
      LEFT JOIN users u ON bha.user_id = u.id
      WHERE bh.deleted_at IS NULL
      GROUP BY bh.id
      ORDER BY bh.created_at DESC
    `);

    res.json(houses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getAvailableAdmins = async (req, res) => {
  try {
    // Get all users (removed admin role requirement)
    const [users] = await pool.execute(`
      SELECT id, username, email 
      FROM users 
      WHERE deleted_at IS NULL
    `);

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Helper function to create predefined chart of accounts for a boarding house
// Note: This function is no longer needed since we now use a global chart of accounts
// const createPredefinedChartOfAccounts = async (connection, boarding_house_id, created_by) => {
//   // This function has been removed since we now use a global chart of accounts
//   // The chart of accounts is created once and shared across all boarding houses
// };

// Function to update existing boarding houses with predefined chart of accounts
exports.updateExistingBoardingHouses = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Get all existing boarding houses
    const [boardingHouses] = await connection.query(
      'SELECT id FROM boarding_houses WHERE deleted_at IS NULL'
    );

    let updatedCount = 0;
    
    for (const house of boardingHouses) {
      // Create predefined chart of accounts for each boarding house
      await createPredefinedChartOfAccounts(connection, house.id, req.user?.id || 1);
      
      // Remove generic "Operating Expenses" if it exists and replace with specific accounts
      await connection.query(
        `UPDATE chart_of_accounts_branch 
         SET deleted_at = NOW() 
         WHERE name = 'Operating Expenses' 
         AND branch_id = ? 
         AND deleted_at IS NULL`,
        [house.id]
      );
      
      updatedCount++;
    }

    await connection.commit();
    
    res.json({ 
      message: `Successfully updated ${updatedCount} boarding houses with predefined chart of accounts`,
      updated_count: updatedCount 
    });
    
  } catch (err) {
    await connection.rollback();
    console.error('Error updating existing boarding houses:', err);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
};