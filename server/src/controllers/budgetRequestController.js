const db = require('../services/db');

// Get all budget requests
const getBudgetRequests = async (req, res) => {
  try {
    const { boarding_house_id } = req.query;
    
    let query = `
      SELECT 
        br.*,
        u1.username as submitted_by_name,
        u2.username as approved_by_name,
        u3.username as rejected_by_name,
        bh.name as boarding_house_name
      FROM budget_requests br
      LEFT JOIN users u1 ON br.submitted_by = u1.id
      LEFT JOIN users u2 ON br.approved_by = u2.id
      LEFT JOIN users u3 ON br.rejected_by = u3.id
      LEFT JOIN boarding_houses bh ON br.boarding_house_id = bh.id
    `;
    
    let params = [];
    
    if (boarding_house_id) {
      query += ' WHERE br.boarding_house_id = ?';
      params.push(boarding_house_id);
    }
    
    query += ' ORDER BY br.created_at DESC';
    
    const [budgetRequests] = await db.query(query, params);
    
    // Get categories for each budget request
    for (let request of budgetRequests) {
      const categoriesQuery = `
        SELECT * FROM budget_categories 
        WHERE budget_request_id = ?
      `;
      const [categories] = await db.query(categoriesQuery, [request.id]);
      request.categories = categories;
    }
    
    res.json(budgetRequests);
  } catch (error) {
    console.error('Error fetching budget requests:', error);
    res.status(500).json({ error: 'Failed to fetch budget requests' });
  }
};

// Get budget request by ID
const getBudgetRequest = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        br.*,
        u1.username as submitted_by_name,
        u2.username as approved_by_name,
        u3.username as rejected_by_name
      FROM budget_requests br
      LEFT JOIN users u1 ON br.submitted_by = u1.id
      LEFT JOIN users u2 ON br.approved_by = u2.id
      LEFT JOIN users u3 ON br.rejected_by = u3.id
      WHERE br.id = ?
    `;
    
    const [budgetRequests] = await db.query(query, [id]);
    
    if (budgetRequests.length === 0) {
      return res.status(404).json({ error: 'Budget request not found' });
    }
    
    const budgetRequest = budgetRequests[0];
    
    // Get categories
    const categoriesQuery = `
      SELECT * FROM budget_categories 
      WHERE budget_request_id = ?
    `;
    const [categories] = await db.query(categoriesQuery, [id]);
    budgetRequest.categories = categories;
    
    res.json(budgetRequest);
  } catch (error) {
    console.error('Error fetching budget request:', error);
    res.status(500).json({ error: 'Failed to fetch budget request' });
  }
};

// Create new budget request
const createBudgetRequest = async (req, res) => {
  try {
    const { boarding_house_id, month, year, totalAmount, description, categories } = req.body;
    const submittedBy = req.user.id;
    
    // Validate required fields
    if (!boarding_house_id || !month || !year || !totalAmount || !categories || categories.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Start transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();
    
    try {
      // Insert budget request
      const insertQuery = `
        INSERT INTO budget_requests (boarding_house_id, month, year, total_amount, description, submitted_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      const [result] = await connection.query(insertQuery, [
        boarding_house_id, month, year, totalAmount, description, submittedBy
      ]);
      
      const budgetRequestId = result.insertId;
      
      // Insert categories
      for (const category of categories) {
        const categoryQuery = `
          INSERT INTO budget_categories (budget_request_id, category_name, amount, description)
          VALUES (?, ?, ?, ?)
        `;
        await connection.query(categoryQuery, [
          budgetRequestId, category.name, category.amount, category.description
        ]);
      }
      
      await connection.commit();
      
      // Fetch the created budget request with all details
      const createdRequest = await getBudgetRequestById(budgetRequestId);
      res.status(201).json(createdRequest);
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('Error creating budget request:', error);
    res.status(500).json({ error: 'Failed to create budget request' });
  }
};

// Approve budget request
const approveBudgetRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const approvedBy = req.user.id;
    
    const query = `
      UPDATE budget_requests 
      SET status = 'approved', approved_by = ?, approved_date = NOW()
      WHERE id = ? AND status = 'pending'
    `;
    
    const [result] = await db.query(query, [approvedBy, id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Budget request not found or already processed' });
    }
    
    // Fetch updated budget request
    const updatedRequest = await getBudgetRequestById(id);
    res.json(updatedRequest);
    
  } catch (error) {
    console.error('Error approving budget request:', error);
    res.status(500).json({ error: 'Failed to approve budget request' });
  }
};

// Reject budget request
const rejectBudgetRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const rejectedBy = req.user.id;
    
    if (!reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }
    
    const query = `
      UPDATE budget_requests 
      SET status = 'rejected', rejected_by = ?, rejected_date = NOW(), rejection_reason = ?
      WHERE id = ? AND status = 'pending'
    `;
    
    const [result] = await db.query(query, [rejectedBy, reason, id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Budget request not found or already processed' });
    }
    
    // Fetch updated budget request
    const updatedRequest = await getBudgetRequestById(id);
    res.json(updatedRequest);
    
  } catch (error) {
    console.error('Error rejecting budget request:', error);
    res.status(500).json({ error: 'Failed to reject budget request' });
  }
};

// Update budget request
const updateBudgetRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { month, year, totalAmount, description, categories } = req.body;
    
    // Check if request exists and is pending
    const checkQuery = 'SELECT * FROM budget_requests WHERE id = ? AND status = "pending"';
    const [existing] = await db.query(checkQuery, [id]);
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Budget request not found or cannot be modified' });
    }
    
    // Start transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();
    
    try {
      // Update budget request
      const updateQuery = `
        UPDATE budget_requests 
        SET month = ?, year = ?, total_amount = ?, description = ?
        WHERE id = ?
      `;
      
      await connection.query(updateQuery, [month, year, totalAmount, description, id]);
      
      // Delete existing categories
      await connection.query('DELETE FROM budget_categories WHERE budget_request_id = ?', [id]);
      
      // Insert new categories
      for (const category of categories) {
        const categoryQuery = `
          INSERT INTO budget_categories (budget_request_id, category_name, amount, description)
          VALUES (?, ?, ?, ?)
        `;
        await connection.query(categoryQuery, [id, category.name, category.amount, category.description]);
      }
      
      await connection.commit();
      
      // Fetch updated budget request
      const updatedRequest = await getBudgetRequestById(id);
      res.json(updatedRequest);
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('Error updating budget request:', error);
    res.status(500).json({ error: 'Failed to update budget request' });
  }
};

// Delete budget request
const deleteBudgetRequest = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if request exists and is pending
    const checkQuery = 'SELECT * FROM budget_requests WHERE id = ? AND status = "pending"';
    const [existing] = await db.query(checkQuery, [id]);
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Budget request not found or cannot be deleted' });
    }
    
    // Delete budget request (categories will be deleted due to CASCADE)
    const deleteQuery = 'DELETE FROM budget_requests WHERE id = ?';
    await db.query(deleteQuery, [id]);
    
    res.json({ message: 'Budget request deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting budget request:', error);
    res.status(500).json({ error: 'Failed to delete budget request' });
  }
};

// Helper function to get budget request by ID
const getBudgetRequestById = async (id) => {
  const query = `
    SELECT 
      br.*,
      u1.username as submitted_by_name,
      u2.username as approved_by_name,
      u3.username as rejected_by_name
    FROM budget_requests br
    LEFT JOIN users u1 ON br.submitted_by = u1.id
    LEFT JOIN users u2 ON br.approved_by = u2.id
    LEFT JOIN users u3 ON br.rejected_by = u3.id
    WHERE br.id = ?
  `;
  
  const [budgetRequests] = await db.query(query, [id]);
  const budgetRequest = budgetRequests[0];
  
  // Get categories
  const categoriesQuery = `
    SELECT * FROM budget_categories 
    WHERE budget_request_id = ?
  `;
  const [categories] = await db.query(categoriesQuery, [id]);
  budgetRequest.categories = categories;
  
  return budgetRequest;
};

module.exports = {
  getBudgetRequests,
  getBudgetRequest,
  createBudgetRequest,
  approveBudgetRequest,
  rejectBudgetRequest,
  updateBudgetRequest,
  deleteBudgetRequest,
  getBudgetRequestById
};
