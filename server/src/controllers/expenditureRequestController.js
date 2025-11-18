const db = require('../services/db');
const path = require('path');
const fs = require('fs').promises;

// Get all expenditure requests
const getExpenditureRequests = async (req, res) => {
  try {
    const { boarding_house_id } = req.query;
    
    let query = `
      SELECT 
        er.*,
        u1.username as submitted_by_name,
        u2.username as approved_by_name,
        u3.username as rejected_by_name,
        bh.name as boarding_house_name
      FROM expenditure_requests er
      LEFT JOIN users u1 ON er.submitted_by = u1.id
      LEFT JOIN users u2 ON er.approved_by = u2.id
      LEFT JOIN users u3 ON er.rejected_by = u3.id
      LEFT JOIN boarding_houses bh ON er.boarding_house_id = bh.id
    `;
    
    let params = [];
    
    if (boarding_house_id) {
      query += ' WHERE er.boarding_house_id = ?';
      params.push(boarding_house_id);
    }
    
    query += ' ORDER BY er.created_at DESC';
    
    const [expenditureRequests] = await db.query(query, params);
    
    // Get attachments for each expenditure request
    for (let request of expenditureRequests) {
      const attachmentsQuery = `
        SELECT id, file_name, file_size, mime_type, uploaded_at
        FROM expenditure_attachments 
        WHERE expenditure_request_id = ?
      `;
      const [attachments] = await db.query(attachmentsQuery, [request.id]);
      request.attachments = attachments.map(att => att.file_name);
    }
    
    res.json(expenditureRequests);
  } catch (error) {
    console.error('Error fetching expenditure requests:', error);
    res.status(500).json({ error: 'Failed to fetch expenditure requests' });
  }
};

// Get expenditure request by ID
const getExpenditureRequest = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        er.*,
        u1.username as submitted_by_name,
        u2.username as approved_by_name,
        u3.username as rejected_by_name
      FROM expenditure_requests er
      LEFT JOIN users u1 ON er.submitted_by = u1.id
      LEFT JOIN users u2 ON er.approved_by = u2.id
      LEFT JOIN users u3 ON er.rejected_by = u3.id
      WHERE er.id = ?
    `;
    
    const [expenditureRequests] = await db.query(query, [id]);
    
    if (expenditureRequests.length === 0) {
      return res.status(404).json({ error: 'Expenditure request not found' });
    }
    
    const expenditureRequest = expenditureRequests[0];
    
    // Get attachments
    const attachmentsQuery = `
      SELECT id, file_name, file_size, mime_type, uploaded_at
      FROM expenditure_attachments 
      WHERE expenditure_request_id = ?
    `;
    const [attachments] = await db.query(attachmentsQuery, [id]);
    expenditureRequest.attachments = attachments.map(att => att.file_name);
    
    res.json(expenditureRequest);
  } catch (error) {
    console.error('Error fetching expenditure request:', error);
    res.status(500).json({ error: 'Failed to fetch expenditure request' });
  }
};

// Create new expenditure request
const createExpenditureRequest = async (req, res) => {
  try {
    const { 
      boarding_house_id, title, description, amount, category, priority, 
      expectedDate, vendor, justification 
    } = req.body;
    const submittedBy = req.user.id;
    
    // Validate required fields
    if (!boarding_house_id || !title || !amount || !category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const insertQuery = `
      INSERT INTO expenditure_requests (
        boarding_house_id, title, description, amount, category, priority, 
        expected_date, vendor, justification, submitted_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await db.query(insertQuery, [
      boarding_house_id, title, description, amount, category, priority,
      expectedDate, vendor, justification, submittedBy
    ]);
    
    const expenditureRequestId = result.insertId;
    
    // Fetch the created expenditure request
    const createdRequest = await getExpenditureRequestById(expenditureRequestId);
    res.status(201).json(createdRequest);
    
  } catch (error) {
    console.error('Error creating expenditure request:', error);
    res.status(500).json({ error: 'Failed to create expenditure request' });
  }
};

// Approve expenditure request
const approveExpenditureRequest = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    const approvedBy = req.user?.id;
    
    // First check if the request exists and is pending
    const [existing] = await connection.query(
      'SELECT * FROM expenditure_requests WHERE id = ?',
      [id]
    );
    
    if (existing.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Expenditure request not found' });
    }
    
    if (existing[0].status !== 'pending') {
      await connection.rollback();
      return res.status(400).json({ 
        error: `Expenditure request is already ${existing[0].status}`,
        currentStatus: existing[0].status
      });
    }
    
    // Verify that the user exists in the users table if approvedBy is provided
    let finalApprovedBy = null;
    if (approvedBy) {
      const [userCheck] = await connection.query(
        'SELECT id FROM users WHERE id = ? AND deleted_at IS NULL',
        [approvedBy]
      );
      if (userCheck.length > 0) {
        finalApprovedBy = approvedBy;
      } else {
        console.warn(`User ID ${approvedBy} not found in users table, setting approved_by to NULL`);
      }
    }
    
    const query = `
      UPDATE expenditure_requests 
      SET status = 'approved', 
          approved_by = ?, 
          approved_date = NOW(),
          updated_at = NOW()
      WHERE id = ? AND status = 'pending'
    `;
    
    const [result] = await connection.query(query, [finalApprovedBy, id]);
    
    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Expenditure request not found or already processed' });
    }
    
    await connection.commit();
    
    // Fetch updated expenditure request using a new query to ensure we get the latest data
    const [updated] = await db.query(
      `SELECT 
        er.*,
        u1.username as submitted_by_name,
        u2.username as approved_by_name,
        u3.username as rejected_by_name,
        bh.name as boarding_house_name
      FROM expenditure_requests er
      LEFT JOIN users u1 ON er.submitted_by = u1.id
      LEFT JOIN users u2 ON er.approved_by = u2.id
      LEFT JOIN users u3 ON er.rejected_by = u3.id
      LEFT JOIN boarding_houses bh ON er.boarding_house_id = bh.id
      WHERE er.id = ?`,
      [id]
    );
    
    if (updated.length === 0) {
      return res.status(404).json({ error: 'Expenditure request not found after update' });
    }
    
    const updatedRequest = updated[0];
    
    // Get attachments
    const [attachments] = await db.query(
      `SELECT id, file_name, file_size, mime_type, uploaded_at
       FROM expenditure_attachments 
       WHERE expenditure_request_id = ?`,
      [id]
    );
    updatedRequest.attachments = attachments.map(att => att.file_name);
    
    res.json(updatedRequest);
    
  } catch (error) {
    await connection.rollback();
    console.error('Error approving expenditure request:', error);
    res.status(500).json({ error: 'Failed to approve expenditure request: ' + error.message });
  } finally {
    connection.release();
  }
};

// Reject expenditure request
const rejectExpenditureRequest = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    // Accept both 'reason' and 'rejection_reason' for compatibility
    const { reason, rejection_reason } = req.body;
    const rejectionReason = reason || rejection_reason;
    const rejectedBy = req.user?.id;
    
    if (!rejectionReason) {
      await connection.rollback();
      return res.status(400).json({ error: 'Rejection reason is required' });
    }
    
    // First check if the request exists and is pending
    const [existing] = await connection.query(
      'SELECT * FROM expenditure_requests WHERE id = ?',
      [id]
    );
    
    if (existing.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Expenditure request not found' });
    }
    
    if (existing[0].status !== 'pending') {
      await connection.rollback();
      return res.status(400).json({ 
        error: `Expenditure request is already ${existing[0].status}`,
        currentStatus: existing[0].status
      });
    }
    
    // Verify that the user exists in the users table if rejectedBy is provided
    let finalRejectedBy = null;
    if (rejectedBy) {
      const [userCheck] = await connection.query(
        'SELECT id FROM users WHERE id = ? AND deleted_at IS NULL',
        [rejectedBy]
      );
      if (userCheck.length > 0) {
        finalRejectedBy = rejectedBy;
      } else {
        console.warn(`User ID ${rejectedBy} not found in users table, setting rejected_by to NULL`);
      }
    }
    
    const query = `
      UPDATE expenditure_requests 
      SET status = 'rejected', 
          rejected_by = ?, 
          rejected_date = NOW(), 
          rejection_reason = ?,
          updated_at = NOW()
      WHERE id = ? AND status = 'pending'
    `;
    
    const [result] = await connection.query(query, [finalRejectedBy, rejectionReason, id]);
    
    if (result.affectedRows === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ error: 'Expenditure request not found or already processed' });
    }
    
    await connection.commit();
    
    console.log(`Expenditure request ${id} rejected successfully by user ${rejectedBy}`);
    
    // Fetch updated expenditure request using the same connection to ensure we get the latest data
    const [updated] = await connection.query(
      `SELECT 
        er.*,
        u1.username as submitted_by_name,
        u2.username as approved_by_name,
        u3.username as rejected_by_name,
        bh.name as boarding_house_name
      FROM expenditure_requests er
      LEFT JOIN users u1 ON er.submitted_by = u1.id
      LEFT JOIN users u2 ON er.approved_by = u2.id
      LEFT JOIN users u3 ON er.rejected_by = u3.id
      LEFT JOIN boarding_houses bh ON er.boarding_house_id = bh.id
      WHERE er.id = ?`,
      [id]
    );
    
    if (updated.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Expenditure request not found after update' });
    }
    
    const updatedRequest = updated[0];
    
    // Get attachments
    const [attachments] = await connection.query(
      `SELECT id, file_name, file_size, mime_type, uploaded_at
       FROM expenditure_attachments 
       WHERE expenditure_request_id = ?`,
      [id]
    );
    updatedRequest.attachments = attachments.map(att => att.file_name);
    
    connection.release();
    res.json(updatedRequest);
    
  } catch (error) {
    await connection.rollback();
    console.error('Error rejecting expenditure request:', error);
    console.error('Error stack:', error.stack);
    connection.release();
    res.status(500).json({ error: 'Failed to reject expenditure request: ' + error.message });
  }
};

// Update expenditure request
const updateExpenditureRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, description, amount, category, priority, 
      expectedDate, vendor, justification 
    } = req.body;
    
    // Check if request exists and is pending
    const checkQuery = 'SELECT * FROM expenditure_requests WHERE id = ? AND status = "pending"';
    const [existing] = await db.query(checkQuery, [id]);
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Expenditure request not found or cannot be modified' });
    }
    
    const updateQuery = `
      UPDATE expenditure_requests 
      SET title = ?, description = ?, amount = ?, category = ?, priority = ?,
          expected_date = ?, vendor = ?, justification = ?
      WHERE id = ?
    `;
    
    await db.query(updateQuery, [
      title, description, amount, category, priority,
      expectedDate, vendor, justification, id
    ]);
    
    // Fetch updated expenditure request
    const updatedRequest = await getExpenditureRequestById(id);
    res.json(updatedRequest);
    
  } catch (error) {
    console.error('Error updating expenditure request:', error);
    res.status(500).json({ error: 'Failed to update expenditure request' });
  }
};

// Delete expenditure request
const deleteExpenditureRequest = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if request exists and is pending
    const checkQuery = 'SELECT * FROM expenditure_requests WHERE id = ? AND status = "pending"';
    const [existing] = await db.query(checkQuery, [id]);
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Expenditure request not found or cannot be deleted' });
    }
    
    // Get attachments to delete files
    const attachmentsQuery = 'SELECT file_path FROM expenditure_attachments WHERE expenditure_request_id = ?';
    const [attachments] = await db.query(attachmentsQuery, [id]);
    
    // Delete files from filesystem
    for (const attachment of attachments) {
      try {
        await fs.unlink(attachment.file_path);
      } catch (fileError) {
        console.error('Error deleting file:', fileError);
      }
    }
    
    // Delete expenditure request (attachments will be deleted due to CASCADE)
    const deleteQuery = 'DELETE FROM expenditure_requests WHERE id = ?';
    await db.query(deleteQuery, [id]);
    
    res.json({ message: 'Expenditure request deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting expenditure request:', error);
    res.status(500).json({ error: 'Failed to delete expenditure request' });
  }
};

// Upload attachment
const uploadAttachment = async (req, res) => {
  try {
    const { id } = req.params;
    const uploadedBy = req.user.id;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Check if expenditure request exists
    const checkQuery = 'SELECT * FROM expenditure_requests WHERE id = ?';
    const [existing] = await db.query(checkQuery, [id]);
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Expenditure request not found' });
    }
    
    const insertQuery = `
      INSERT INTO expenditure_attachments (
        expenditure_request_id, file_name, file_path, file_size, mime_type, uploaded_by
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    await db.query(insertQuery, [
      id, req.file.originalname, req.file.path, req.file.size, req.file.mimetype, uploadedBy
    ]);
    
    res.json({ message: 'File uploaded successfully' });
    
  } catch (error) {
    console.error('Error uploading attachment:', error);
    res.status(500).json({ error: 'Failed to upload attachment' });
  }
};

// Download attachment
const downloadAttachment = async (req, res) => {
  try {
    const { id, attachmentId } = req.params;
    
    const query = `
      SELECT file_name, file_path, mime_type
      FROM expenditure_attachments 
      WHERE id = ? AND expenditure_request_id = ?
    `;
    
    const [attachments] = await db.query(query, [attachmentId, id]);
    
    if (attachments.length === 0) {
      return res.status(404).json({ error: 'Attachment not found' });
    }
    
    const attachment = attachments[0];
    
    // Check if file exists
    try {
      await fs.access(attachment.file_path);
    } catch (error) {
      return res.status(404).json({ error: 'File not found on disk' });
    }
    
    res.download(attachment.file_path, attachment.file_name);
    
  } catch (error) {
    console.error('Error downloading attachment:', error);
    res.status(500).json({ error: 'Failed to download attachment' });
  }
};

// Helper function to get expenditure request by ID
const getExpenditureRequestById = async (id) => {
  const query = `
    SELECT 
      er.*,
      u1.username as submitted_by_name,
      u2.username as approved_by_name,
      u3.username as rejected_by_name
    FROM expenditure_requests er
    LEFT JOIN users u1 ON er.submitted_by = u1.id
    LEFT JOIN users u2 ON er.approved_by = u2.id
    LEFT JOIN users u3 ON er.rejected_by = u3.id
    WHERE er.id = ?
  `;
  
  const [expenditureRequests] = await db.query(query, [id]);
  const expenditureRequest = expenditureRequests[0];
  
  // Get attachments
  const attachmentsQuery = `
    SELECT id, file_name, file_size, mime_type, uploaded_at
    FROM expenditure_attachments 
    WHERE expenditure_request_id = ?
  `;
  const [attachments] = await db.query(attachmentsQuery, [id]);
  expenditureRequest.attachments = attachments.map(att => att.file_name);
  
  return expenditureRequest;
};

// Integrate confirmed expenditure with main expenses system
const integrateWithMainExpenses = async (expenditureRequest, confirmedBy, receiptPath, providedConnection = null) => {
  const connection = providedConnection || await db.getConnection();
  const { updateAccountBalance } = require('../services/accountBalanceService');
  const shouldReleaseConnection = !providedConnection;
  
  try {
    if (!providedConnection) {
      await connection.beginTransaction();
    }

    // Find the expense account ID from the category name
    const [expenseAccounts] = await connection.query(
      `SELECT id FROM chart_of_accounts 
       WHERE name = ? AND type = 'Expense' AND deleted_at IS NULL`,
      [expenditureRequest.category]
    );

    if (expenseAccounts.length === 0) {
      throw new Error(`Expense account not found for category: ${expenditureRequest.category}`);
    }

    const expenseAccountId = expenseAccounts[0].id;

    // Find cash account for credit entry (assuming cash payment)
    const [cashAccounts] = await connection.query(
      `SELECT id FROM chart_of_accounts 
       WHERE name LIKE '%Cash%' AND type = 'Asset' AND deleted_at IS NULL 
       ORDER BY id LIMIT 1`
    );

    if (cashAccounts.length === 0) {
      throw new Error('Cash account not found for credit entry');
    }

    const cashAccountId = cashAccounts[0].id;

    // Create transaction header
    const [transactionResult] = await connection.query(
      `INSERT INTO transactions (
        transaction_type, transaction_date, reference, description, amount,
        boarding_house_id, created_by, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'posted')`,
      [
        'expense',
        expenditureRequest.expected_date || new Date().toISOString().split('T')[0],
        `EXP-REQ-${expenditureRequest.id}`,
        `Expenditure Request: ${expenditureRequest.title}`,
        expenditureRequest.amount,
        expenditureRequest.boarding_house_id,
        confirmedBy
      ]
    );

    const transactionId = transactionResult.insertId;

    // Create expense record
    await connection.query(
      `INSERT INTO expenses (
        transaction_id, expense_date, amount, total_amount, remaining_balance,
        description, payment_method, payment_status, reference_number,
        expense_account_id, supplier_id, notes, receipt_path, receipt_original_name,
        boarding_house_id, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        transactionId,
        expenditureRequest.expected_date || new Date().toISOString().split('T')[0],
        expenditureRequest.amount,
        expenditureRequest.amount,
        0, // remaining_balance: 0 for cash payment
        expenditureRequest.description || expenditureRequest.title,
        'cash', // payment_method: assuming cash
        'full', // payment_status: full payment
        `EXP-REQ-${expenditureRequest.id}`,
        expenseAccountId,
        null, // supplier_id: could be enhanced to find supplier by vendor name
        expenditureRequest.justification,
        receiptPath,
        receiptPath ? path.basename(receiptPath) : null,
        expenditureRequest.boarding_house_id,
        confirmedBy
      ]
    );

    // Create journal entries
    // Debit expense account
    await connection.query(
      `INSERT INTO journal_entries (
        transaction_id, account_id, entry_type, amount, description,
        boarding_house_id, created_by
      ) VALUES (?, ?, 'debit', ?, ?, ?, ?)`,
      [
        transactionId,
        expenseAccountId,
        expenditureRequest.amount,
        `Expenditure Request: ${expenditureRequest.title}`,
        expenditureRequest.boarding_house_id,
        confirmedBy
      ]
    );

    // Credit cash account
    await connection.query(
      `INSERT INTO journal_entries (
        transaction_id, account_id, entry_type, amount, description,
        boarding_house_id, created_by
      ) VALUES (?, ?, 'credit', ?, ?, ?, ?)`,
      [
        transactionId,
        cashAccountId,
        expenditureRequest.amount,
        `Payment for: ${expenditureRequest.title}`,
        expenditureRequest.boarding_house_id,
        confirmedBy
      ]
    );

    // Update account balances after creating journal entries
    console.log('Updating account balances for expenditure:');
    console.log('Expense Account ID:', expenseAccountId, 'Amount:', expenditureRequest.amount, 'Type: debit');
    console.log('Cash Account ID:', cashAccountId, 'Amount:', expenditureRequest.amount, 'Type: credit');
    
    await updateAccountBalance(
      expenseAccountId,
      expenditureRequest.amount,
      'debit',
      expenditureRequest.boarding_house_id,
      connection
    );

    await updateAccountBalance(
      cashAccountId,
      expenditureRequest.amount,
      'credit',
      expenditureRequest.boarding_house_id,
      connection
    );
    
    console.log('Account balance updates completed');

    if (!providedConnection) {
      await connection.commit();
    }
    console.log(`Expenditure request ${expenditureRequest.id} integrated with main expenses system`);

  } catch (error) {
    if (!providedConnection) {
      await connection.rollback();
    }
    console.error('Error integrating with main expenses:', error);
    throw error;
  } finally {
    if (shouldReleaseConnection) {
      connection.release();
    }
  }
};

// Confirm expenditure and update status to 'actioned'
const confirmExpenditure = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    const confirmedBy = req.user.id;

    // Check if expenditure request exists and is approved
    const [requests] = await connection.query(
      'SELECT * FROM expenditure_requests WHERE id = ? AND status = ?',
      [id, 'approved']
    );

    if (requests.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Expenditure request not found or not approved' });
    }

    const expenditureRequest = requests[0];

    // Find cash account (petty cash) to check balance
    const [cashAccounts] = await connection.query(
      `SELECT id, code, name FROM chart_of_accounts 
       WHERE name LIKE '%Cash%' AND type = 'Asset' AND deleted_at IS NULL 
       ORDER BY id LIMIT 1`
    );

    if (cashAccounts.length === 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'Cash account not found' });
    }

    const cashAccountId = cashAccounts[0].id;
    const cashAccountCode = cashAccounts[0].code;
    const cashAccountName = cashAccounts[0].name;

    // Check current balance of petty cash account
    const [balanceResult] = await connection.query(
      'SELECT current_balance FROM current_account_balances WHERE account_id = ?',
      [cashAccountId]
    );

    const currentBalance = balanceResult.length > 0 
      ? parseFloat(balanceResult[0].current_balance || 0) 
      : 0;

    const expenditureAmount = parseFloat(expenditureRequest.amount);

    // Check if balance is sufficient
    if (currentBalance < expenditureAmount) {
      await connection.rollback();
      console.log('Insufficient balance check failed:', {
        currentBalance,
        expenditureAmount,
        cashAccountId,
        cashAccountName
      });
      return res.status(400).json({ 
        error: `Insufficient petty cash balance. Current balance: $${currentBalance.toFixed(2)}, Required: $${expenditureAmount.toFixed(2)}`,
        message: `Insufficient petty cash balance. Current balance: $${currentBalance.toFixed(2)}, Required: $${expenditureAmount.toFixed(2)}`,
        currentBalance: currentBalance,
        requiredAmount: expenditureAmount,
        accountName: cashAccountName
      });
    }

    // Handle file upload if receipt is provided
    let receiptPath = null;
    if (req.file) {
      receiptPath = req.file.path;
      
      // Save receipt attachment
      const attachmentQuery = `
        INSERT INTO expenditure_attachments (expenditure_request_id, file_name, file_path, file_size, mime_type, uploaded_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      await connection.query(attachmentQuery, [
        id,
        req.file.filename,
        receiptPath,
        req.file.size,
        req.file.mimetype,
        confirmedBy
      ]);
    }

    // Update status to 'actioned'
    const updateQuery = `
      UPDATE expenditure_requests 
      SET status = 'actioned', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    await connection.query(updateQuery, [id]);

    // Integrate with main expenses system (this will use the connection from the transaction)
    await integrateWithMainExpenses(expenditureRequest, confirmedBy, receiptPath, connection);

    // Update petty cash user account balance (deduct the expenditure amount)
    // Use the user who submitted the request, not the one confirming it
    // This ensures the correct user's petty cash account is deducted
    await updatePettyCashUserBalance(connection, expenditureRequest.submitted_by, expenditureAmount, expenditureRequest.boarding_house_id, `Expenditure: ${expenditureRequest.title}`);

    await connection.commit();

    // Return updated expenditure request
    const updatedRequest = await getExpenditureRequestById(id);
    res.json(updatedRequest);

  } catch (error) {
    await connection.rollback();
    console.error('Error confirming expenditure:', error);
    console.error('Error stack:', error.stack);
    
    // If it's a known error with a message, return it
    if (error.message && error.message.includes('Insufficient')) {
      return res.status(400).json({ 
        error: error.message,
        currentBalance: error.currentBalance,
        requiredAmount: error.requiredAmount
      });
    }
    
    // Return the error message
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ 
      error: error.message || 'Failed to confirm expenditure',
      details: error.stack
    });
  } finally {
    connection.release();
  }
};

// Helper function to update petty cash user account balance
const updatePettyCashUserBalance = async (connection, userId, amount, boardingHouseId, description) => {
  try {
    console.log(`Updating petty cash user balance: User ${userId}, Amount ${amount}, Boarding House ${boardingHouseId}`);
    
    // First check if this is a petty cash user (has petty_cash_user_id)
    // If not, check if it's a regular user that needs to be linked to a petty cash account
    const [pettyCashUser] = await connection.query(
      `SELECT id FROM petty_cash_users WHERE id = ? AND deleted_at IS NULL`,
      [userId]
    );
    
    let pettyCashUserId = null;
    if (pettyCashUser.length > 0) {
      // This is a petty cash user
      pettyCashUserId = userId;
    } else {
      // Check if there's a petty cash user linked to this regular user
      const [linkedUser] = await connection.query(
        `SELECT id FROM petty_cash_users WHERE user_id = ? AND deleted_at IS NULL`,
        [userId]
      );
      if (linkedUser.length > 0) {
        pettyCashUserId = linkedUser[0].id;
      }
    }
    
    if (!pettyCashUserId) {
      console.log(`No petty cash user found for user ${userId}. Cannot update petty cash balance.`);
      // Don't throw error - just log it, as the expenditure might be confirmed by an admin user
      return;
    }
    
    // Check if user has a petty cash account using petty_cash_user_id
    const [accounts] = await connection.query(
      `SELECT id, current_balance FROM petty_cash_accounts 
       WHERE petty_cash_user_id = ? AND boarding_house_id = ? AND deleted_at IS NULL`,
      [pettyCashUserId, boardingHouseId]
    );
    
    console.log(`Found ${accounts.length} accounts for petty cash user ${pettyCashUserId} in boarding house ${boardingHouseId}`);
    
    if (accounts.length === 0) {
      console.log(`No petty cash account found for petty cash user ${pettyCashUserId} in boarding house ${boardingHouseId}.`);
      // Don't throw error - just log it
      return;
    }
    
    const account = accounts[0];
    const oldBalance = parseFloat(account.current_balance || 0);
    const amountDecimal = parseFloat(amount);
    const newBalance = oldBalance - amountDecimal; // Deduct the expenditure amount
    
    // Round to 2 decimal places to avoid floating point precision issues
    const roundedNewBalance = Math.round(newBalance * 100) / 100;
    
    console.log(`Updating petty cash account ${account.id}: ${oldBalance} -> ${roundedNewBalance} (expenditure deduction)`);
    
    // Add transaction record - use user_id (the table uses user_id, not petty_cash_user_id)
    await connection.query(
      `INSERT INTO petty_cash_transactions (
        user_id, boarding_house_id, transaction_type, amount, description, transaction_date, created_by, created_at
      ) VALUES (?, ?, 'cash_outflow', ?, ?, NOW(), ?, NOW())`,
      [userId, boardingHouseId, amountDecimal, description, userId]
    );
    
    // Update account balance with rounded value (deduct expenditure)
    await connection.query(
      `UPDATE petty_cash_accounts 
       SET current_balance = ?, 
           total_outflows = COALESCE(total_outflows, 0) + ?,
           updated_at = NOW() 
       WHERE id = ?`,
      [roundedNewBalance, amountDecimal, account.id]
    );
    
    console.log(`Updated petty cash account ${account.id} balance to ${roundedNewBalance}`);
    
  } catch (error) {
    console.error('Error updating petty cash user balance:', error);
    // Don't throw error - just log it, as the expenditure confirmation should still succeed
    // The COA balance has already been updated, so this is just for tracking the user's account
  }
};

module.exports = {
  getExpenditureRequests,
  getExpenditureRequest,
  createExpenditureRequest,
  approveExpenditureRequest,
  rejectExpenditureRequest,
  updateExpenditureRequest,
  deleteExpenditureRequest,
  uploadAttachment,
  downloadAttachment,
  confirmExpenditure
};
