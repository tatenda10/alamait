const db = require('../services/db');

// Create a new supplier
exports.createSupplier = async (req, res) => {
  try {
    const { 
      company, 
      contact_person, 
      phone, 
      address, 
      category, 
      status,
      boarding_house_id 
    } = req.body;
    
    // Validate required fields
    if (!company) {
      return res.status(400).json({ message: 'Company name is required' });
    }
    if (!contact_person) {
      return res.status(400).json({ message: 'Contact person is required' });
    }
    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }
    if (!address) {
      return res.status(400).json({ message: 'Address is required' });
    }
    if (!category) {
      return res.status(400).json({ message: 'Category is required' });
    }

    // Get boarding_house_id from request body or user context
    const finalBoardingHouseId = boarding_house_id || req.user?.boarding_house_id || 1;
    
    const [result] = await db.query(
      `INSERT INTO suppliers (
        company, contact_person, phone, address, category, status, boarding_house_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        company, 
        contact_person, 
        phone, 
        address, 
        category, 
        status || 'active', 
        finalBoardingHouseId
      ]
    );
    
    res.status(201).json({ 
      id: result.insertId, 
      message: 'Supplier created successfully',
      data: { 
        id: result.insertId, 
        company, 
        contact_person, 
        phone, 
        address, 
        category, 
        status: status || 'active',
        boarding_house_id: finalBoardingHouseId
      }
    });
  } catch (error) {
    console.error('Error creating supplier:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get accounts payable for a specific supplier
exports.getSupplierAccountsPayable = async (req, res) => {
  try {
    const { id } = req.params;
    const boardingHouseId = req.user?.boarding_house_id || 1; // Use default boarding house ID if not authenticated
    
    // Check if supplier exists and belongs to the boarding house (or skip boarding house check if no auth)
    let supplierQuery, supplierParams;
    if (req.user?.boarding_house_id) {
      supplierQuery = 'SELECT id, company FROM suppliers WHERE id = ? AND boarding_house_id = ?';
      supplierParams = [id, boardingHouseId];
    } else {
      supplierQuery = 'SELECT id, company FROM suppliers WHERE id = ?';
      supplierParams = [id];
    }
    
    const [suppliers] = await db.query(supplierQuery, supplierParams);
    
    if (suppliers.length === 0) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    // Get accounts payable data for this supplier
    // This could include unpaid invoices, outstanding balances, etc.
    // For now, we'll return sample data structure that matches what the frontend expects
    const [accountsPayable] = await db.query(
      `SELECT 
        sp.id,
        sp.reference_number as invoice_number,
        sp.payment_date as date,
        sp.payment_date as due_date,
        sp.amount,
        sp.amount as balance,
        CASE 
          WHEN sp.payment_date IS NULL THEN 'pending'
          ELSE 'paid'
        END as status,
        sp.description,
        sp.payment_method,
        sp.notes,
        sp.created_at
      FROM supplier_payments sp
      WHERE sp.supplier_id = ?
      ORDER BY sp.created_at DESC`,
      [id]
    );

    res.json(accountsPayable);
  } catch (error) {
    console.error('Error fetching supplier accounts payable:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// List all suppliers (optionally filter by boarding_house_id)
exports.getSuppliers = async (req, res) => {
  try {
    const { boarding_house_id } = req.query;
    let query = `
      SELECT 
        s.id,
        s.company,
        s.contact_person,
        s.phone,
        s.address,
        s.category,
        s.status,
        s.boarding_house_id,
        s.created_at,
        s.updated_at,
        COUNT(DISTINCT sp.id) as total_orders,
        COALESCE(SUM(sp.amount), 0) as total_spent
      FROM suppliers s
      LEFT JOIN supplier_payments sp ON s.id = sp.supplier_id
    `;
    const params = [];
    
    // Filter by boarding house if provided, otherwise use user's boarding house
    const filterBoardingHouseId = boarding_house_id || req.user?.boarding_house_id;
    if (filterBoardingHouseId) {
      query += ' WHERE s.boarding_house_id = ?';
      params.push(filterBoardingHouseId);
    }
    
    query += ' GROUP BY s.id ORDER BY s.company';
    
    const [suppliers] = await db.query(query, params);
    
    res.json({ 
      data: suppliers,
      message: 'Suppliers retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get a single supplier by ID
exports.getSupplierById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [suppliers] = await db.query(
      `SELECT 
        s.id,
        s.company,
        s.contact_person,
        s.phone,
        s.address,
        s.category,
        s.status,
        s.boarding_house_id,
        s.created_at,
        s.updated_at,
        COUNT(DISTINCT sp.id) as total_orders,
        COALESCE(SUM(sp.amount), 0) as total_spent
      FROM suppliers s
      LEFT JOIN supplier_payments sp ON s.id = sp.supplier_id
      WHERE s.id = ?
      GROUP BY s.id`,
      [id]
    );
    
    if (suppliers.length === 0) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    
    res.json({ 
      data: suppliers[0],
      message: 'Supplier retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching supplier:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update supplier info
exports.updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      company, 
      contact_person, 
      phone, 
      address, 
      category, 
      status,
      boarding_house_id 
    } = req.body;
    
    // Check if supplier exists
    const [existing] = await db.query('SELECT id FROM suppliers WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    
    // Validate required fields if provided
    if (company !== undefined && !company) {
      return res.status(400).json({ message: 'Company name cannot be empty' });
    }
    if (contact_person !== undefined && !contact_person) {
      return res.status(400).json({ message: 'Contact person cannot be empty' });
    }
    if (phone !== undefined && !phone) {
      return res.status(400).json({ message: 'Phone number cannot be empty' });
    }
    if (address !== undefined && !address) {
      return res.status(400).json({ message: 'Address cannot be empty' });
    }
    if (category !== undefined && !category) {
      return res.status(400).json({ message: 'Category cannot be empty' });
    }
    
    await db.query(
      `UPDATE suppliers SET 
        company = COALESCE(?, company),
        contact_person = COALESCE(?, contact_person),
        phone = COALESCE(?, phone),
        address = COALESCE(?, address),
        category = COALESCE(?, category),
        status = COALESCE(?, status),
        boarding_house_id = COALESCE(?, boarding_house_id),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [
        company, 
        contact_person, 
        phone, 
        address, 
        category, 
        status, 
        boarding_house_id, 
        id
      ]
    );
    
    res.json({ 
      message: 'Supplier updated successfully',
      data: { 
        id, 
        company, 
        contact_person, 
        phone, 
        address, 
        category, 
        status 
      }
    });
  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get expenses for a specific supplier
exports.getSupplierExpenses = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get expenses linked to this supplier through supplier_payments
    const [expenses] = await db.query(
      `SELECT 
        e.id,
        e.expense_date as date,
        e.description,
        e.amount,
        e.payment_method,
        e.reference_number,
        e.notes,
        sp.reference_number as payment_reference,
        sp.payment_date,
        coa.name as category
      FROM expenses e
      INNER JOIN supplier_payments sp ON e.id = sp.expense_id
      LEFT JOIN chart_of_accounts_branch coa ON e.expense_account_id = coa.id
      WHERE sp.supplier_id = ?
      ORDER BY e.expense_date DESC`,
      [id]
    );

    res.json(expenses);
  } catch (error) {
    console.error('Error fetching supplier expenses:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete supplier
exports.deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if supplier exists
    const [existing] = await db.query('SELECT company FROM suppliers WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    
    await db.query('DELETE FROM suppliers WHERE id = ?', [id]);
    res.json({ 
      message: `Supplier "${existing[0].company}" deleted successfully` 
    });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};