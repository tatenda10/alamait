const db = require('../services/db');

// Helper function to generate next available code for a given type and branch
const generateNextCode = async (connection, type, branch_id) => {
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

  // Get the highest code for this type in this branch
  const [maxCodes] = await connection.query(
    `SELECT code FROM chart_of_accounts_branch 
     WHERE branch_id = ? 
     AND code LIKE ? 
     AND deleted_at IS NULL 
     ORDER BY code DESC 
     LIMIT 1`,
    [branch_id, `${prefix}%`]
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

// Create a new account for a branch
exports.createBranchAccount = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    console.log('Received request body:', req.body);
    console.log('Received request headers:', req.headers);
    
    const { name, type, is_category, parent_id } = req.body;
    const branch_id = req.headers['boarding-house-id'];
    
    console.log('Parsed COA data:', {
      name,
      type,
      is_category,
      parent_id,
      branch_id
    });

    if (!branch_id) {
      console.log('Missing boarding house ID in headers');
      return res.status(400).json({ message: 'Boarding house ID is required' });
    }

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
    const code = await generateNextCode(connection, type, branch_id);
    console.log('Generated code:', code);

    // Create the account
    const [result] = await connection.query(
      `INSERT INTO chart_of_accounts_branch 
       (code, name, type, is_category, parent_id, branch_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [code, name, type, is_category || false, parent_id || null, branch_id]
    );

    await connection.commit();

    res.status(201).json({
      data: {
        id: result.insertId,
        code,
        name,
        type,
        is_category: is_category || false,
        parent_id: parent_id || null,
        branch_id
      }
    });

  } catch (error) {
    console.log('Error in createBranchAccount:', error);
    await connection.rollback();
    res.status(500).json({ message: 'Error creating account' });
  } finally {
    connection.release();
  }
};

// Get all accounts for a branch in a hierarchical structure
exports.getBranchAccounts = async (req, res) => {
  try {
    const branch_id = req.headers['boarding-house-id'];
    if (!branch_id) {
      return res.status(400).json({ message: 'Boarding house ID is required' });
    }

    const [accounts] = await db.query(
      `WITH RECURSIVE account_tree AS (
        -- Base case: get all root accounts (no parent) for this branch
        SELECT 
          id,
          branch_id,
          code,
          name,
          type,
          is_category,
          parent_id,
          1 as level,
          CAST(code AS CHAR(255)) as path
        FROM chart_of_accounts_branch
        WHERE parent_id IS NULL 
          AND branch_id = ?
          AND deleted_at IS NULL
        
        UNION ALL
        
        -- Recursive case: get children
        SELECT 
          c.id,
          c.branch_id,
          c.code,
          c.name,
          c.type,
          c.is_category,
          c.parent_id,
          p.level + 1,
          CONCAT(p.path, ',', c.code)
        FROM chart_of_accounts_branch c
        INNER JOIN account_tree p ON c.parent_id = p.id
        WHERE c.deleted_at IS NULL AND c.branch_id = ?
      )
      SELECT * FROM account_tree
      ORDER BY path;`,
      [branch_id, branch_id]
    );

    // Transform flat list into hierarchical structure
    const accountMap = new Map();
    const rootAccounts = [];

    accounts.forEach(account => {
      account.children = [];
      accountMap.set(account.id, account);
      
      if (account.parent_id === null) {
        rootAccounts.push(account);
      } else {
        const parent = accountMap.get(account.parent_id);
        if (parent) {
          parent.children.push(account);
        }
      }
    });

    res.json({ data: rootAccounts });
  } catch (error) {
    console.error('Error in getBranchAccounts:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update a branch account
exports.updateBranchAccount = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    const { code, name, type, is_category, parent_id } = req.body;
    const branch_id = req.headers['boarding-house-id'];
    
    if (!branch_id) {
      return res.status(400).json({ message: 'Boarding house ID is required' });
    }

    // Check if account exists and belongs to the branch
    const [accounts] = await connection.query(
      'SELECT * FROM chart_of_accounts_branch WHERE id = ? AND branch_id = ? AND deleted_at IS NULL',
      [id, branch_id]
    );

    if (accounts.length === 0) {
      return res.status(404).json({ message: 'Account not found in this branch' });
    }

    // Check if new code is unique within the branch (if changed)
    if (code !== accounts[0].code) {
      const [existingAccounts] = await connection.query(
        'SELECT id FROM chart_of_accounts_branch WHERE code = ? AND id != ? AND branch_id = ? AND deleted_at IS NULL',
        [code, id, branch_id]
      );

      if (existingAccounts.length > 0) {
        return res.status(400).json({ message: 'Account code already exists in this branch' });
      }
    }

    // If parent_id is provided and changed, verify it exists in the same branch and prevent circular reference
    if (parent_id && parent_id !== accounts[0].parent_id) {
      const [parents] = await connection.query(
        'SELECT id FROM chart_of_accounts_branch WHERE id = ? AND branch_id = ? AND deleted_at IS NULL',
        [parent_id, branch_id]
      );

      if (parents.length === 0) {
        return res.status(400).json({ message: 'Parent account not found in this branch' });
      }

      // Prevent circular reference
      let currentParentId = parent_id;
      while (currentParentId) {
        if (currentParentId === id) {
          return res.status(400).json({ message: 'Circular reference detected' });
        }
        const [parent] = await connection.query(
          'SELECT parent_id FROM chart_of_accounts_branch WHERE id = ? AND branch_id = ?',
          [currentParentId, branch_id]
        );
        currentParentId = parent[0]?.parent_id;
      }
    }

    // Update account
    await connection.query(
      `UPDATE chart_of_accounts_branch 
       SET code = ?,
           name = ?,
           type = ?,
           is_category = ?,
           parent_id = ?,
           updated_at = NOW()
       WHERE id = ? AND branch_id = ?`,
      [code, name, type, is_category, parent_id, id, branch_id]
    );

    const [updatedAccount] = await connection.query(
      'SELECT * FROM chart_of_accounts_branch WHERE id = ?',
      [id]
    );

    await connection.commit();
    res.json({ data: updatedAccount[0] });
  } catch (error) {
    await connection.rollback();
    console.error('Error in updateBranchAccount:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
};

// Delete a branch account
exports.deleteBranchAccount = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    const branch_id = req.headers['boarding-house-id'];
    
    if (!branch_id) {
      return res.status(400).json({ message: 'Boarding house ID is required' });
    }

    // Check if account exists and belongs to the branch
    const [accounts] = await connection.query(
      'SELECT * FROM chart_of_accounts_branch WHERE id = ? AND branch_id = ? AND deleted_at IS NULL',
      [id, branch_id]
    );

    if (accounts.length === 0) {
      return res.status(404).json({ message: 'Account not found in this branch' });
    }

    // Check if account has children
    const [children] = await connection.query(
      'SELECT id FROM chart_of_accounts_branch WHERE parent_id = ? AND branch_id = ? AND deleted_at IS NULL',
      [id, branch_id]
    );

    if (children.length > 0) {
      return res.status(400).json({ message: 'Cannot delete account with child accounts' });
    }

    // Soft delete the account
    await connection.query(
      'UPDATE chart_of_accounts_branch SET deleted_at = NOW() WHERE id = ? AND branch_id = ?',
      [id, branch_id]
    );

    await connection.commit();
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error in deleteBranchAccount:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
}; 

// Get all accounts across all boarding houses
exports.getAllAccounts = async (req, res) => {
  try {
    const [accounts] = await db.query(
      `WITH RECURSIVE account_tree AS (
        -- Base case: get all root accounts across all branches
        SELECT 
          coa.id,
          coa.branch_id,
          coa.code,
          coa.name,
          coa.type,
          coa.is_category,
          coa.parent_id,
          1 as level,
          CAST(coa.code AS CHAR(255)) as path,
          bh.name as boarding_house_name,
          bh.location as boarding_house_location
        FROM chart_of_accounts_branch coa
        JOIN boarding_houses bh ON coa.branch_id = bh.id
        WHERE coa.parent_id IS NULL 
          AND coa.deleted_at IS NULL
          AND bh.deleted_at IS NULL
        
        UNION ALL
        
        -- Recursive case: get children
        SELECT 
          c.id,
          c.branch_id,
          c.code,
          c.name,
          c.type,
          c.is_category,
          c.parent_id,
          p.level + 1,
          CONCAT(p.path, ',', c.code),
          p.boarding_house_name,
          p.boarding_house_location
        FROM chart_of_accounts_branch c
        INNER JOIN account_tree p ON c.parent_id = p.id
        WHERE c.deleted_at IS NULL
      )
      SELECT * FROM account_tree
      ORDER BY branch_id, path;`
    );

    // Transform flat list into hierarchical structure grouped by boarding house
    const boardingHouseMap = new Map();

    accounts.forEach(account => {
      const boardingHouseId = account.branch_id;
      
      // Initialize boarding house entry if it doesn't exist
      if (!boardingHouseMap.has(boardingHouseId)) {
        boardingHouseMap.set(boardingHouseId, {
          id: boardingHouseId,
          name: account.boarding_house_name,
          location: account.boarding_house_location,
          accounts: new Map(),
          rootAccounts: []
        });
      }

      const boardingHouse = boardingHouseMap.get(boardingHouseId);
      
      // Add children array to account
      account.children = [];
      
      // Add account to the boarding house's account map
      boardingHouse.accounts.set(account.id, account);
      
      if (account.parent_id === null) {
        boardingHouse.rootAccounts.push(account);
      } else {
        const parent = boardingHouse.accounts.get(account.parent_id);
        if (parent) {
          parent.children.push(account);
        }
      }
    });

    // Convert the map to an array and format the response
    const result = Array.from(boardingHouseMap.values()).map(bh => ({
      id: bh.id,
      name: bh.name,
      location: bh.location,
      accounts: bh.rootAccounts
    }));

    res.json({ data: result });
  } catch (error) {
    console.error('Error in getAllAccounts:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}; 