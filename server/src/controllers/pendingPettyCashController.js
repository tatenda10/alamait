const db = require('../services/db');
const path = require('path');

// Submit a new pending petty cash expense
exports.submitPendingExpense = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const userId = req.params.id;
    const { 
      amount, 
      description, 
      category, 
      vendor_name, 
      receipt_number, 
      expense_account_id, 
      reference_number, 
      expense_date, 
      notes 
    } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
    }
    
    if (!description) {
      return res.status(400).json({
        success: false,
        message: 'Description is required'
      });
    }
    
    // Verify user exists and get current balance
    const [userCheck] = await connection.query(
      `SELECT pcu.id, pcu.username, pcb.current_balance 
       FROM petty_cash_users pcu
       LEFT JOIN petty_cash_balances pcb ON pcu.id = pcb.petty_cash_user_id
       WHERE pcu.id = ? AND pcu.status = "active"`,
      [userId]
    );
    
    if (userCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found or inactive'
      });
    }
    
    const expenseAmount = parseFloat(amount);
    const currentBalance = parseFloat(userCheck[0].current_balance || 0);
    
    // Check if user has sufficient balance
    if (currentBalance < expenseAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Current balance: $${currentBalance.toFixed(2)}`
      });
    }
    
    // Handle file upload if present
    let receiptPath = null;
    let receiptOriginalName = null;
    
    if (req.file) {
      receiptPath = path.relative(path.join(__dirname, '../../../uploads'), req.file.path);
      receiptOriginalName = req.file.originalname;
    }
    
    // Create pending expense record
    const [pendingExpenseResult] = await connection.query(
      `INSERT INTO pending_petty_cash_expenses 
       (petty_cash_user_id, boarding_house_id, amount, description, category, 
        vendor_name, receipt_number, receipt_path, receipt_original_name, 
        expense_account_id, reference_number, expense_date, notes, submitted_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId, 
        req.user.boarding_house_id || 1, 
        expenseAmount, 
        description, 
        category, 
        vendor_name, 
        receipt_number, 
        receiptPath, 
        receiptOriginalName, 
        expense_account_id, 
        reference_number, 
        expense_date, 
        notes,
        userId  // Use the same petty_cash_user_id for submitted_by
      ]
    );

    // IMMEDIATELY DEDUCT BALANCE when pending expense is submitted
    console.log('=== PENDING EXPENSE BALANCE UPDATE DEBUG ===');
    console.log('User ID:', userId);
    console.log('Deducting amount:', expenseAmount);
    
    // Get balance before update
    const [balanceBefore] = await connection.query(
      'SELECT current_balance FROM petty_cash_balances WHERE petty_cash_user_id = ?',
      [userId]
    );
    console.log('Balance before update:', balanceBefore[0]?.current_balance);
    
    // Update the balance immediately (deduct the expense amount)
    const [updateResult] = await connection.query(
      `UPDATE petty_cash_balances 
       SET current_balance = current_balance - ?, 
           total_expenses_month = total_expenses_month + ?,
           total_expenses_year = total_expenses_year + ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE petty_cash_user_id = ?`,
      [expenseAmount, expenseAmount, expenseAmount, userId]
    );
    
    console.log('Update result affected rows:', updateResult.affectedRows);
    
    // Get balance after update
    const [balanceAfter] = await connection.query(
      'SELECT current_balance FROM petty_cash_balances WHERE petty_cash_user_id = ?',
      [userId]
    );
    console.log('Balance after update:', balanceAfter[0]?.current_balance);
    console.log('=== END PENDING EXPENSE BALANCE UPDATE DEBUG ===');
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Expense submitted for approval',
      data: {
        pending_expense_id: pendingExpenseResult.insertId,
        amount: expenseAmount,
        status: 'pending'
      }
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error submitting pending expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit expense'
    });
  } finally {
    connection.release();
  }
};

// Get all pending expenses for admin review
exports.getPendingExpenses = async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    const [expenses] = await db.query(
      `SELECT 
        ppe.*,
        pcu.username,
        pcu.full_name,
        pcu.employee_id,
        bh.name as boarding_house_name,
        coa.name as expense_account_name,
        coa.code as expense_account_code,
        u.username as submitted_by_username,
        ru.username as reviewed_by_username
       FROM pending_petty_cash_expenses ppe
       LEFT JOIN petty_cash_users pcu ON ppe.petty_cash_user_id = pcu.id
       LEFT JOIN boarding_houses bh ON ppe.boarding_house_id = bh.id
       LEFT JOIN chart_of_accounts_branch coa ON ppe.expense_account_id = coa.id
       LEFT JOIN users u ON ppe.submitted_by = u.id
       LEFT JOIN users ru ON ppe.reviewed_by = ru.id
       WHERE ppe.status = ? AND ppe.deleted_at IS NULL
       ORDER BY ppe.submitted_at DESC
       LIMIT ? OFFSET ?`,
      [status, parseInt(limit), parseInt(offset)]
    );
    
    // Get total count
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total 
       FROM pending_petty_cash_expenses 
       WHERE status = ? AND deleted_at IS NULL`,
      [status]
    );
    
    res.json({
      success: true,
      data: {
        expenses,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          pages: Math.ceil(countResult[0].total / limit)
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching pending expenses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending expenses'
    });
  }
};

// Approve a pending expense
exports.approvePendingExpense = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const expenseId = req.params.id;
    const { notes } = req.body;
    
    // Get the pending expense details
    const [pendingExpense] = await connection.query(
      `SELECT * FROM pending_petty_cash_expenses 
       WHERE id = ? AND status = 'pending' AND deleted_at IS NULL`,
      [expenseId]
    );
    
    if (pendingExpense.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pending expense not found or already processed'
      });
    }
    
    const expense = pendingExpense[0];
    
    // Verify user still has sufficient balance
    const [userBalance] = await connection.query(
      `SELECT current_balance FROM petty_cash_balances 
       WHERE petty_cash_user_id = ?`,
      [expense.petty_cash_user_id]
    );
    
    // Also check if there's a petty cash account for this user
    const [pettyCashAccount] = await connection.query(
      `SELECT id, current_balance, account_name FROM petty_cash_accounts 
       WHERE assigned_user_id = ? AND status = 'active'`,
      [expense.petty_cash_user_id]
    );
    
    // Check all balance records for debugging
    const [allBalances] = await connection.query(
      `SELECT * FROM petty_cash_balances WHERE petty_cash_user_id = ?`,
      [expense.petty_cash_user_id]
    );
    
    console.log('=== ADDITIONAL BALANCE DEBUG ===');
    console.log('Petty Cash Account Query Result:', pettyCashAccount);
    console.log('All Balance Records:', allBalances);
    
    // Debug logging for balance checking
    console.log('=== BALANCE CHECK DEBUG ===');
    console.log('Expense ID:', expenseId);
    console.log('Petty Cash User ID:', expense.petty_cash_user_id);
    console.log('Expense Amount:', expense.amount);
    console.log('User Balance Query Result:', userBalance);
    console.log('User Balance Length:', userBalance.length);
    if (userBalance.length > 0) {
      console.log('Current Balance:', userBalance[0].current_balance);
      console.log('Balance Type:', typeof userBalance[0].current_balance);
      console.log('Amount Type:', typeof expense.amount);
      console.log('Balance >= Amount:', userBalance[0].current_balance >= expense.amount);
      console.log('Balance < Amount:', userBalance[0].current_balance < expense.amount);
    }
    
    // Check balance from petty_cash_balances first, then fallback to petty_cash_accounts
    let currentBalance = 0;
    let balanceSource = '';
    
    if (userBalance.length > 0 && userBalance[0].current_balance !== null) {
      currentBalance = parseFloat(userBalance[0].current_balance);
      balanceSource = 'petty_cash_balances';
    } else if (pettyCashAccount.length > 0 && pettyCashAccount[0].current_balance !== null) {
      currentBalance = parseFloat(pettyCashAccount[0].current_balance);
      balanceSource = 'petty_cash_accounts';
      console.log('FALLBACK: Using balance from petty_cash_accounts table');
    } else {
      console.log('BALANCE CHECK FAILED - No balance record found in either table');
      return res.status(400).json({
        success: false,
        message: 'No balance record found for this user'
      });
    }
    
    // Convert expense amount to number as well
    const expenseAmount = parseFloat(expense.amount);
    
    console.log('Balance Source:', balanceSource);
    console.log('Current Balance Used (number):', currentBalance);
    console.log('Expense Amount (number):', expenseAmount);
    console.log('Balance Type After Conversion:', typeof currentBalance);
    console.log('Amount Type After Conversion:', typeof expenseAmount);
    console.log('Sufficient Balance:', currentBalance >= expenseAmount);
    
    if (currentBalance < expenseAmount) {
      console.log('BALANCE CHECK FAILED - Insufficient balance');
      return res.status(400).json({
        success: false,
        message: `Insufficient balance to approve this expense. Available: $${currentBalance.toFixed(2)}, Required: $${expenseAmount.toFixed(2)}`
      });
    }
    
    console.log('BALANCE CHECK PASSED - Proceeding with approval');
    
    // Create the actual petty cash transaction
    const [transactionResult] = await connection.query(
      `INSERT INTO petty_cash_transactions 
       (petty_cash_user_id, boarding_house_id, transaction_type, amount, description, 
        category, vendor_name, receipt_number, receipt_path, receipt_original_name,
        expense_account_id, reference_number, transaction_date, notes, status, 
        approved_by, approved_at)
       VALUES (?, ?, 'expense', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', ?, NOW())`,
      [
        expense.petty_cash_user_id,
        expense.boarding_house_id,
        expenseAmount,
        expense.description,
        expense.category,
        expense.vendor_name,
        expense.receipt_number,
        expense.receipt_path,
        expense.receipt_original_name,
        expense.expense_account_id,
        expense.reference_number,
        expense.expense_date,
        notes || expense.notes,
        req.user.id
      ]
    );
    
    // Update user balance in the correct table
    if (balanceSource === 'petty_cash_balances') {
      await connection.query(
        `UPDATE petty_cash_balances 
         SET current_balance = current_balance - ?, 
             updated_at = NOW()
         WHERE petty_cash_user_id = ?`,
        [expenseAmount, expense.petty_cash_user_id]
      );
      console.log('Updated balance in petty_cash_balances table');
    } else if (balanceSource === 'petty_cash_accounts') {
      await connection.query(
        `UPDATE petty_cash_accounts 
         SET current_balance = current_balance - ?, 
             updated_at = NOW()
         WHERE assigned_user_id = ? AND status = 'active'`,
        [expenseAmount, expense.petty_cash_user_id]
      );
      console.log('Updated balance in petty_cash_accounts table');
    }
    
    // Update pending expense status
    await connection.query(
      `UPDATE pending_petty_cash_expenses 
       SET status = 'approved', reviewed_by = ?, reviewed_at = NOW(), 
           notes = CONCAT(COALESCE(notes, ''), CASE WHEN notes IS NOT NULL THEN '\n\nApproval Notes: ' ELSE 'Approval Notes: ' END, ?)
       WHERE id = ?`,
      [req.user.id, notes || 'Approved', expenseId]
    );
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Expense approved successfully',
      data: {
        transaction_id: transactionResult.insertId,
        amount: expenseAmount
      }
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error approving expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve expense'
    });
  } finally {
    connection.release();
  }
};

// Reject a pending expense
exports.rejectPendingExpense = async (req, res) => {
  try {
    const expenseId = req.params.id;
    const { rejection_reason } = req.body;
    
    if (!rejection_reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }
    
    // Update pending expense status
    const [result] = await db.query(
      `UPDATE pending_petty_cash_expenses 
       SET status = 'rejected', reviewed_by = ?, reviewed_at = NOW(), 
           rejection_reason = ?
       WHERE id = ? AND status = 'pending' AND deleted_at IS NULL`,
      [req.user.id, rejection_reason, expenseId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pending expense not found or already processed'
      });
    }
    
    res.json({
      success: true,
      message: 'Expense rejected successfully'
    });
    
  } catch (error) {
    console.error('Error rejecting expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject expense'
    });
  }
};

// Get pending expenses for a specific user
exports.getUserPendingExpenses = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    let statusFilter = '';
    let queryParams = [userId];
    
    if (status) {
      statusFilter = 'AND ppe.status = ?';
      queryParams.push(status);
    }
    
    queryParams.push(parseInt(limit), parseInt(offset));
    
    const [expenses] = await db.query(
      `SELECT 
        ppe.*,
        coa.name as expense_account_name,
        coa.code as expense_account_code,
        u.username as submitted_by_username,
        ru.username as reviewed_by_username
       FROM pending_petty_cash_expenses ppe
       LEFT JOIN chart_of_accounts_branch coa ON ppe.expense_account_id = coa.id
       LEFT JOIN users u ON ppe.submitted_by = u.id
       LEFT JOIN users ru ON ppe.reviewed_by = ru.id
       WHERE ppe.petty_cash_user_id = ? ${statusFilter} AND ppe.deleted_at IS NULL
       ORDER BY ppe.submitted_at DESC
       LIMIT ? OFFSET ?`,
      queryParams
    );
    
    res.json({
      success: true,
      data: {
        expenses
      }
    });
    
  } catch (error) {
    console.error('Error fetching user pending expenses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user pending expenses'
    });
  }
};