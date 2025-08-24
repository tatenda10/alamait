const db = require('../services/db');

// Helper function to generate next available code for a given type
const generateNextCode = async (connection, type) => {
  // Define prefix based on account type
  const prefixMap = {
    'Asset': '1',
    'Liability': '2',
    'Equity': '3',
    'Revenue': '4',
    'Expense': '5'
  };

  const prefix = prefixMap[type];
  if (!prefix) {
    throw new Error('Invalid account type');
  }

  // Get the highest code for this type
  const [maxCodes] = await connection.query(
    `SELECT code FROM chart_of_accounts 
     WHERE code LIKE ? 
     AND deleted_at IS NULL 
     ORDER BY code DESC 
     LIMIT 1`,
    [`${prefix}%`]
  );

  if (maxCodes.length === 0) {
    // No existing codes, start with prefix + 0001
    return `${prefix}0001`;
  }

  // Get the current highest number and increment
  const currentCode = maxCodes[0].code;
  const currentNumber = parseInt(currentCode.substring(1));
  const nextNumber = currentNumber + 1;
  
  // Format to ensure 4 digits
  return `${prefix}${String(nextNumber).padStart(4, '0')}`;
};

// Create a new account (global chart of accounts)
exports.createAccount = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    console.log('Received request body:', req.body);
    
    const { name, type, is_category, parent_id } = req.body;

    // Validate required fields
    if (!name || !type) {
      return res.status(400).json({ message: 'Name and type are required' });
    }

    // Validate account type
    const validTypes = ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: 'Invalid account type' });
    }

    // Generate the next available code for this type
    const code = await generateNextCode(connection, type);
    console.log('Generated code:', code);

    // Create the account
    const [result] = await connection.query(
      `INSERT INTO chart_of_accounts 
       (code, name, type, is_category, parent_id, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [code, name, type, is_category || false, parent_id || null, req.user.id]
    );

    await connection.commit();

    res.status(201).json({
      data: {
        id: result.insertId,
        code,
        name,
        type,
        is_category: is_category || false,
        parent_id: parent_id || null
      }
    });

  } catch (error) {
    console.log('Error in createAccount:', error);
    await connection.rollback();
    res.status(500).json({ message: 'Error creating account' });
  } finally {
    connection.release();
  }
};

// Get all accounts in a hierarchical structure (global chart of accounts)
exports.getAccounts = async (req, res) => {
  try {
    const [accounts] = await db.query(
      `WITH RECURSIVE account_tree AS (
        -- Base case: get all root accounts (no parent)
        SELECT 
          id,
          code,
          name,
          type,
          is_category,
          parent_id,
          1 as level,
          CAST(code AS CHAR(255)) as path
        FROM chart_of_accounts
        WHERE parent_id IS NULL 
          AND deleted_at IS NULL
        
        UNION ALL
        
        -- Recursive case: get children
        SELECT 
          c.id,
          c.code,
          c.name,
          c.type,
          c.is_category,
          c.parent_id,
          p.level + 1,
          CONCAT(p.path, ',', c.code)
        FROM chart_of_accounts c
        INNER JOIN account_tree p ON c.parent_id = p.id
        WHERE c.deleted_at IS NULL
      )
      SELECT * FROM account_tree
      ORDER BY path;`
    );

    // Transform flat list into hierarchical structure
    const accountMap = new Map();
    const rootAccounts = [];

    accounts.forEach(account => {
      account.children = [];
      accountMap.set(account.id, account);
    });

    accounts.forEach(account => {
      if (account.parent_id === null) {
        rootAccounts.push(account);
      } else {
        const parent = accountMap.get(account.parent_id);
        if (parent) {
          parent.children.push(account);
        }
      }
    });

    res.json({
      data: rootAccounts
    });

  } catch (error) {
    console.error('Error in getAccounts:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update an account
exports.updateAccount = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    const { name, type, is_category, parent_id } = req.body;

    // Validate required fields
    if (!name || !type) {
      return res.status(400).json({ message: 'Name and type are required' });
    }

    // Validate account type
    const validTypes = ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: 'Invalid account type' });
    }

    // Check if account exists
    const [existingAccount] = await connection.query(
      'SELECT id FROM chart_of_accounts WHERE id = ? AND deleted_at IS NULL',
      [id]
    );

    if (existingAccount.length === 0) {
      return res.status(404).json({ message: 'Account not found' });
    }

    // Update the account
    await connection.query(
      `UPDATE chart_of_accounts 
       SET name = ?, type = ?, is_category = ?, parent_id = ?, updated_at = NOW()
       WHERE id = ?`,
      [name, type, is_category || false, parent_id || null, id]
    );

    await connection.commit();

    res.json({
      message: 'Account updated successfully',
      data: {
        id: parseInt(id),
        name,
        type,
        is_category: is_category || false,
        parent_id: parent_id || null
      }
    });

  } catch (error) {
    console.error('Error in updateAccount:', error);
    await connection.rollback();
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
};

// Delete an account (soft delete)
exports.deleteAccount = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;

    // Check if account exists
    const [existingAccount] = await connection.query(
      'SELECT id FROM chart_of_accounts WHERE id = ? AND deleted_at IS NULL',
      [id]
    );

    if (existingAccount.length === 0) {
      return res.status(404).json({ message: 'Account not found' });
    }

    // Check if account has children
    const [children] = await connection.query(
      'SELECT id FROM chart_of_accounts WHERE parent_id = ? AND deleted_at IS NULL',
      [id]
    );

    if (children.length > 0) {
      return res.status(400).json({ message: 'Cannot delete account with child accounts' });
    }

    // Check if account is used in journal entries
    const [journalEntries] = await connection.query(
      'SELECT id FROM journal_entries WHERE account_id = ? AND deleted_at IS NULL',
      [id]
    );

    if (journalEntries.length > 0) {
      return res.status(400).json({ message: 'Cannot delete account that has journal entries' });
    }

    // Soft delete the account
    await connection.query(
      'UPDATE chart_of_accounts SET deleted_at = NOW() WHERE id = ?',
      [id]
    );

    await connection.commit();

    res.json({
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('Error in deleteAccount:', error);
    await connection.rollback();
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
};

// Get account by ID
exports.getAccountById = async (req, res) => {
  try {
    const { id } = req.params;

    const [accounts] = await db.query(
      'SELECT * FROM chart_of_accounts WHERE id = ? AND deleted_at IS NULL',
      [id]
    );

    if (accounts.length === 0) {
      return res.status(404).json({ message: 'Account not found' });
    }

    res.json({
      data: accounts[0]
    });

  } catch (error) {
    console.error('Error in getAccountById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get accounts by type
exports.getAccountsByType = async (req, res) => {
  try {
    const { type } = req.params;

    const [accounts] = await db.query(
      'SELECT * FROM chart_of_accounts WHERE type = ? AND deleted_at IS NULL ORDER BY code',
      [type]
    );

    res.json({
      data: accounts
    });

  } catch (error) {
    console.error('Error in getAccountsByType:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}; 