const db = require('../services/db');
const path = require('path');
const fs = require('fs').promises;

// Record an expense
exports.recordExpense = async (req, res) => {
  // Debug logs
  console.log('Request User:', req.user);
  console.log('Request Headers:', req.headers);
  console.log('Request Body:', req.body);

  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const boardingHouseId = req.body.boarding_house_id;
    const userId = 1;
    
    if (!boardingHouseId) {
      return res.status(400).json({ message: 'Boarding house ID is required' });
    }

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const {
      expense_date,
      amount,
      description,
      payment_method,
      reference_number,
      expense_account_id,
      supplier_id,
      notes
    } = req.body;

    // Validate required fields
    if (!expense_date || !amount || !expense_account_id || !payment_method) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Parse amount as float
    const expenseAmount = parseFloat(amount);
    if (isNaN(expenseAmount) || expenseAmount <= 0) {
      return res.status(400).json({ message: 'Invalid expense amount' });
    }

    // Handle receipt file if uploaded
    let receiptPath = null;
    let receiptName = null;
    if (req.file) {
      receiptPath = path.relative(path.join(__dirname, '../../uploads'), req.file.path);
      receiptName = req.file.originalname;
    }

    // Verify expense account exists and is of type 'Expense'
    const [accounts] = await connection.query(
      `SELECT * FROM chart_of_accounts_branch 
       WHERE id = ? 
         AND type = 'Expense'
         AND branch_id = ?`,
      [expense_account_id, boardingHouseId]
    );

    if (accounts.length === 0) {
      return res.status(400).json({ message: 'Invalid expense account' });
    }

    // Verify supplier exists if supplier_id is provided
    if (supplier_id) {
      const [suppliers] = await connection.query(
        `SELECT id FROM suppliers 
         WHERE id = ? 
           AND boarding_house_id = ?
           AND status = 'active'`,
        [supplier_id, boardingHouseId]
      );

      if (suppliers.length === 0) {
        return res.status(400).json({ message: 'Invalid supplier' });
      }
    }

    // Verify supplier exists if supplier_id is provided
    if (supplier_id) {
      const [suppliers] = await connection.query(
        `SELECT id FROM suppliers 
         WHERE id = ? 
           AND boarding_house_id = ?
           AND status = 'active'`,
        [supplier_id, boardingHouseId]
      );

      if (suppliers.length === 0) {
        return res.status(400).json({ message: 'Invalid supplier' });
      }
    }

    // Determine credit account based on payment method
    let creditAccountCode;
    let isCredit = false;
    
    switch (payment_method) {
      case 'cash':
        creditAccountCode = '10002'; // Cash on Hand
        break;
      case 'bank_transfer':
        creditAccountCode = '10003'; // Bank Account
        break;
      case 'petty_cash':
        creditAccountCode = '10001'; // Petty Cash
        break;
      case 'credit':
        creditAccountCode = '20001'; // Accounts Payable
        isCredit = true;
        break;
      default:
        creditAccountCode = '10002'; // Default to Cash on Hand
    }

    // Get credit account ID
    const [creditAccounts] = await connection.query(
      `SELECT id FROM chart_of_accounts_branch 
       WHERE code = ? 
         AND branch_id = ?
         AND deleted_at IS NULL`,
      [creditAccountCode, boardingHouseId]
    );

    if (creditAccounts.length === 0) {
      return res.status(400).json({ 
        message: isCredit ? 'Accounts Payable account not found' : 'Cash/Bank account not found' 
      });
    }

    const creditAccountId = creditAccounts[0].id;

    // Create transaction record
    const [transactionResult] = await connection.query(
      `INSERT INTO transactions (
        transaction_type,
        reference,
        amount,
        currency,
        description,
        transaction_date,
        boarding_house_id,
        created_by,
        created_at,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'posted')`,
      [
        'expense',
        reference_number || `EXP-${Date.now()}`,
        expenseAmount,
        'USD', // Default currency
        description,
        expense_date,
        boardingHouseId,
        userId
      ]
    );

    // Create expense record
    const [expenseResult] = await connection.query(
      `INSERT INTO expenses (
        transaction_id,
        expense_date,
        amount,
        total_amount,
        remaining_balance,
        description,
        payment_method,
        payment_status,
        remaining_payment_method,
        reference_number,
        expense_account_id,
        supplier_id,
        notes,
        receipt_path,
        receipt_original_name,
        boarding_house_id,
        created_by,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        transactionResult.insertId,
        expense_date,
        expenseAmount,
        expenseAmount, // total_amount same as amount initially
        isCredit ? expenseAmount : 0, // remaining_balance: full amount if credit, 0 if paid
        description,
        payment_method,
        isCredit ? 'debt' : 'full', // payment_status: debt if credit, full if cash/bank
        isCredit ? 'credit' : null, // remaining_payment_method: credit if unpaid
        reference_number || `EXP-${Date.now()}`,
        expense_account_id,
        supplier_id || null,
        notes,
        receiptPath,
        receiptName,
        boardingHouseId,
        userId
      ]
    );

    // Create journal entries
    // Debit expense account
    await connection.query(
      `INSERT INTO journal_entries (
        transaction_id,
        account_id,
        entry_type,
        amount,
        description,
        boarding_house_id,
        created_by,
        created_at
      ) VALUES (?, ?, 'debit', ?, ?, ?, ?, NOW())`,
      [
        transactionResult.insertId,
        expense_account_id,
        expenseAmount,
        `${description} - Expense`,
        boardingHouseId,
        userId
      ]
    );

    // Credit cash/bank account or accounts payable
    await connection.query(
      `INSERT INTO journal_entries (
        transaction_id,
        account_id,
        entry_type,
        amount,
        description,
        boarding_house_id,
        created_by,
        created_at
      ) VALUES (?, ?, 'credit', ?, ?, ?, ?, NOW())`,
      [
        transactionResult.insertId,
        creditAccountId,
        expenseAmount,
        `${description} - ${isCredit ? 'Accounts Payable' : 'Payment'}`,
        boardingHouseId,
        userId
      ]
    );

    await connection.commit();
    res.status(201).json({ 
      message: 'Expense recorded successfully',
      data: {
        id: expenseResult.insertId,
        transaction_id: transactionResult.insertId
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error in recordExpense:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
};

// Update an expense
exports.updateExpense = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    const boardingHouseId = req.body.boarding_house_id;
    const userId = 1;
    
    if (!boardingHouseId) {
      return res.status(400).json({ message: 'Boarding house ID is required' });
    }

    const {
      expense_date,
      amount,
      description,
      payment_method,
      reference_number,
      expense_account_id,
      supplier_id,
      notes
    } = req.body;

    // Validate amount
    const expenseAmount = parseFloat(amount);
    if (isNaN(expenseAmount) || expenseAmount <= 0) {
      return res.status(400).json({ message: 'Invalid expense amount' });
    }

    // Get current expense to check if it exists and belongs to the boarding house
    const [expenses] = await connection.query(
      `SELECT e.*, t.id as transaction_id 
       FROM expenses e
       JOIN transactions t ON e.transaction_id = t.id
       WHERE e.id = ? 
         AND e.boarding_house_id = ?
         AND e.deleted_at IS NULL`,
      [id, boardingHouseId]
    );

    if (expenses.length === 0) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    const expense = expenses[0];

    // Handle receipt file if uploaded
    let receiptPath = expense.receipt_path;
    let receiptName = expense.receipt_original_name;
    if (req.file) {
      // Delete old receipt if exists
      if (expense.receipt_path) {
        const oldFilePath = path.join(__dirname, '../../uploads', expense.receipt_path);
        await fs.unlink(oldFilePath).catch(() => {});
      }
      receiptPath = path.relative(path.join(__dirname, '../../uploads'), req.file.path);
      receiptName = req.file.originalname;
    }

    // Verify expense account exists and is of type 'Expense'
    const [accounts] = await connection.query(
      `SELECT * FROM chart_of_accounts_branch 
       WHERE id = ? 
         AND type = 'Expense'
         AND branch_id = ?`,
      [expense_account_id, boardingHouseId]
    );

    if (accounts.length === 0) {
      return res.status(400).json({ message: 'Invalid expense account' });
    }

    // Determine credit account (cash/bank) based on payment method
    let creditAccountCode;
    switch (payment_method) {
      case 'cash':
        creditAccountCode = '10002'; // Cash on Hand
        break;
      case 'bank_transfer':
        creditAccountCode = '10003'; // Bank Account
        break;
      case 'petty_cash':
        creditAccountCode = '10001'; // Petty Cash
        break;
      default:
        creditAccountCode = '10002'; // Default to Cash on Hand
    }

    // Get credit account ID
    const [creditAccounts] = await connection.query(
      `SELECT id FROM chart_of_accounts_branch 
       WHERE code = ? 
         AND branch_id = ?
         AND deleted_at IS NULL`,
      [creditAccountCode, boardingHouseId]
    );

    if (creditAccounts.length === 0) {
      return res.status(400).json({ message: 'Cash/Bank account not found' });
    }

    const creditAccountId = creditAccounts[0].id;

    // Update expense record
    await connection.query(
      `UPDATE expenses SET
        expense_date = ?,
        amount = ?,
        description = ?,
        payment_method = ?,
        reference_number = ?,
        expense_account_id = ?,
        supplier_id = ?,
        notes = ?,
        receipt_path = ?,
        receipt_original_name = ?
       WHERE id = ?`,
      [
        expense_date,
        expenseAmount,
        description,
        payment_method,
        reference_number,
        expense_account_id,
        supplier_id || null,
        notes,
        receiptPath,
        receiptName,
        id
      ]
    );

    // Update transaction record
    await connection.query(
      `UPDATE transactions SET
        amount = ?,
        description = ?,
        reference = ?,
        transaction_date = ?
       WHERE id = ?`,
      [
        expenseAmount,
        description,
        reference_number || `EXP-${Date.now()}`,
        expense_date,
        expense.transaction_id
      ]
    );

    // Update journal entries
    // First, delete old entries
    await connection.query(
      `DELETE FROM journal_entries WHERE transaction_id = ?`,
      [expense.transaction_id]
    );

    // Create new debit entry
    await connection.query(
      `INSERT INTO journal_entries (
        transaction_id,
        account_id,
        entry_type,
        amount,
        description,
        boarding_house_id,
        created_by,
        created_at
      ) VALUES (?, ?, 'debit', ?, ?, ?, ?, NOW())`,
      [
        expense.transaction_id,
        expense_account_id,
        expenseAmount,
        description,
        boardingHouseId,
        userId
      ]
    );

    // Create new credit entry
    await connection.query(
      `INSERT INTO journal_entries (
        transaction_id,
        account_id,
        entry_type,
        amount,
        description,
        boarding_house_id,
        created_by,
        created_at
      ) VALUES (?, ?, 'credit', ?, ?, ?, ?, NOW())`,
      [
        expense.transaction_id,
        creditAccountId,
        expenseAmount,
        description,
        boardingHouseId,
        userId
      ]
    );

    await connection.commit();
    res.json({ message: 'Expense updated successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error in updateExpense:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
};

// Get all expenses for a boarding house
exports.getBoardingHouseExpenses = async (req, res) => {
  try {
    const boardingHouseId = req.query.boarding_house_id;
    if (!boardingHouseId) {
      return res.status(400).json({ message: 'Boarding house ID is required' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    // Get total count with search
    const [totalResult] = await db.query(
      `SELECT COUNT(*) as total
       FROM expenses e
       JOIN chart_of_accounts_branch coa ON e.expense_account_id = coa.id
       WHERE e.boarding_house_id = ?
         AND e.deleted_at IS NULL
         AND (
           e.description LIKE ?
           OR e.reference_number LIKE ?
           OR coa.name LIKE ?
           OR coa.code LIKE ?
         )`,
      [boardingHouseId, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`]
    );

    // Get paginated expenses with search
    const [expenses] = await db.query(
      `SELECT 
        e.*,
        coa.name as expense_account_name,
        coa.code as expense_account_code,
        t.status as transaction_status,
        s.company as supplier_name,
        s.contact_person as supplier_contact
      FROM expenses e
      JOIN chart_of_accounts_branch coa ON e.expense_account_id = coa.id
      LEFT JOIN transactions t ON e.transaction_id = t.id
      LEFT JOIN suppliers s ON e.supplier_id = s.id
      WHERE e.boarding_house_id = ?
        AND e.deleted_at IS NULL
        AND (
          e.description LIKE ?
          OR e.reference_number LIKE ?
          OR coa.name LIKE ?
          OR coa.code LIKE ?
        )
      ORDER BY e.expense_date DESC, e.created_at DESC
      LIMIT ? OFFSET ?`,
      [boardingHouseId, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, limit, offset]
    );

    res.json({
      expenses,
      total: totalResult[0].total,
      page,
      limit,
      totalPages: Math.ceil(totalResult[0].total / limit)
    });
  } catch (error) {
    console.error('Error in getBoardingHouseExpenses:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get expenses without supplier
exports.getExpensesWithoutSupplier = async (req, res) => {
  try {
    // Use boarding house ID from user if authenticated, otherwise use default (1)
    const boardingHouseId = req.user?.boarding_house_id || 1;

    // Get expenses that don't have a supplier_id or have null supplier_id
    const [expenses] = await db.query(
      `SELECT 
        e.id,
        e.expense_date as date,
        e.amount,
        e.description,
        e.payment_method,
        e.reference_number,
        coa.name as category,
        coa.code as account_code,
        e.created_at,
        e.updated_at
      FROM expenses e
      LEFT JOIN chart_of_accounts_branch coa ON e.expense_account_id = coa.id
      LEFT JOIN supplier_payments sp ON e.id = sp.expense_id
      WHERE e.boarding_house_id = ?
        AND e.deleted_at IS NULL
        AND sp.expense_id IS NULL
      ORDER BY e.expense_date DESC, e.created_at DESC`,
      [boardingHouseId]
    );

    res.json(expenses);
  } catch (error) {
    console.error('Error in getExpensesWithoutSupplier:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get expense by ID
exports.getExpenseById = async (req, res) => {
  try {
    const { id } = req.params;
    const boardingHouseId = req.user.boarding_house_id;
    
    if (!boardingHouseId) {
      return res.status(400).json({ message: 'Boarding house ID is required' });
    }

    const [expenses] = await db.query(
      `SELECT 
        e.*,
        t.reference as transaction_reference,
        t.status as transaction_status,
        coa.name as expense_account_name,
        coa.code as expense_account_code,
        s.id as supplier_id,
        s.company as supplier_name,
        s.contact_person as supplier_contact,
        s.phone as supplier_phone,
        s.address as supplier_address
      FROM expenses e
      JOIN transactions t ON e.transaction_id = t.id
      JOIN chart_of_accounts_branch coa ON e.expense_account_id = coa.id
      LEFT JOIN suppliers s ON e.supplier_id = s.id
      WHERE e.id = ? 
        AND e.boarding_house_id = ?
        AND e.deleted_at IS NULL`,
      [id, boardingHouseId]
    );

    if (expenses.length === 0) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json(expenses[0]);
  } catch (error) {
    console.error('Error in getExpenseById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete an expense
exports.deleteExpense = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    const boardingHouseId = req.user.boarding_house_id;
    
    if (!boardingHouseId) {
      return res.status(400).json({ message: 'Boarding house ID is required' });
    }

    // Get current expense to check if it exists and belongs to the boarding house
    const [expenses] = await connection.query(
      `SELECT e.*, t.id as transaction_id 
       FROM expenses e
       JOIN transactions t ON e.transaction_id = t.id
       WHERE e.id = ? 
         AND e.boarding_house_id = ?
         AND e.deleted_at IS NULL`,
      [id, boardingHouseId]
    );

    if (expenses.length === 0) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    const expense = expenses[0];

    // Delete receipt file if exists
    if (expense.receipt_path) {
      const filePath = path.join(__dirname, '../../uploads', expense.receipt_path);
      await fs.unlink(filePath).catch(() => {});
    }

    // Soft delete the expense
    await connection.query(
      `UPDATE expenses 
       SET deleted_at = NOW(),
           updated_at = NOW()
       WHERE id = ?`,
      [id]
    );

    // Soft delete the transaction
    await connection.query(
      `UPDATE transactions 
       SET deleted_at = NOW(),
           updated_at = NOW()
       WHERE id = ?`,
      [expense.transaction_id]
    );

    await connection.commit();
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error in deleteExpense:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
}; 

// Get all expenses across all boarding houses
exports.getAllExpenses = async (req, res) => {
  try {
    // Get all expenses from both regular expenses and petty cash expenses
    const [expenses] = await db.query(
      `SELECT 
        'regular' as expense_type,
        e.id,
        e.expense_date,
        e.amount,
        e.description,
        e.payment_method,
        e.payment_status,
        e.remaining_balance,
        e.reference_number,
        e.expense_account_id,
        coa.name as expense_account_name,
        coa.code as expense_account_code,
        coa.type as expense_account_type,
        t.status as transaction_status,
        e.boarding_house_id,
        bh.name as boarding_house_name,
        bh.location as boarding_house_location,
        e.receipt_path,
        e.receipt_original_name,
        e.supplier_id,
        s.company as supplier_name,
        s.contact_person as supplier_contact,
        s.phone as supplier_phone,
        s.address as supplier_address,
        COALESCE(sp.total_paid, 0) as total_paid,
        e.created_at,
        e.updated_at
      FROM expenses e
      LEFT JOIN chart_of_accounts_branch coa ON e.expense_account_id = coa.id
      LEFT JOIN transactions t ON e.transaction_id = t.id
      LEFT JOIN boarding_houses bh ON e.boarding_house_id = bh.id
      LEFT JOIN suppliers s ON e.supplier_id = s.id
      LEFT JOIN (
        SELECT 
          expense_id,
          SUM(amount) as total_paid
        FROM supplier_payments 
        WHERE deleted_at IS NULL
        GROUP BY expense_id
      ) sp ON e.id = sp.expense_id
      WHERE e.deleted_at IS NULL

      UNION ALL

      SELECT 
        'petty_cash' as expense_type,
        pct.id,
        pct.transaction_date as expense_date,
        pct.amount,
        pct.description,
        'petty_cash' as payment_method,
        'full' as payment_status,
        0 as remaining_balance,
        pct.receipt_number as reference_number,
        pct.expense_account_id,
        coa.name as expense_account_name,
        coa.code as expense_account_code,
        coa.type as expense_account_type,
        pct.status as transaction_status,
        pct.boarding_house_id,
        bh.name as boarding_house_name,
        bh.location as boarding_house_location,
        pct.receipt_path,
        pct.receipt_original_name,
        NULL as supplier_id,
        pct.vendor_name as supplier_name,
        NULL as supplier_contact,
        NULL as supplier_phone,
        NULL as supplier_address,
        pct.amount as total_paid,
        pct.created_at,
        pct.updated_at
      FROM petty_cash_transactions pct
      LEFT JOIN chart_of_accounts_branch coa ON pct.expense_account_id = coa.id
      LEFT JOIN boarding_houses bh ON pct.boarding_house_id = bh.id
      WHERE pct.deleted_at IS NULL 
        AND pct.transaction_type = 'expense' 
        AND pct.status = 'approved'

      ORDER BY expense_date DESC, created_at DESC`,
      []
    );

    // Log the results to debug
    console.log('Found expenses:', expenses.length);
    if (expenses.length > 0) {
      console.log('Sample expense:', {
        id: expenses[0].id,
        type: expenses[0].expense_type,
        amount: expenses[0].amount,
        payment_status: expenses[0].payment_status,
        remaining_balance: expenses[0].remaining_balance,
        total_paid: expenses[0].total_paid,
        description: expenses[0].description,
        boarding_house: {
          id: expenses[0].boarding_house_id,
          name: expenses[0].boarding_house_name
        },
        account: {
          name: expenses[0].expense_account_name,
          code: expenses[0].expense_account_code
        },
        supplier: expenses[0].supplier_id ? {
          id: expenses[0].supplier_id,
          name: expenses[0].supplier_name,
          contact: expenses[0].supplier_contact
        } : null
      });
    }

    // Format the response
    const formattedExpenses = expenses.map(expense => ({
      id: expense.id,
      expense_type: expense.expense_type,
      expense_date: expense.expense_date,
      amount: expense.amount,
      description: expense.description,
      payment_method: expense.payment_method,
      payment_status: expense.payment_status,
      remaining_balance: expense.remaining_balance || 0,
      total_paid: expense.total_paid || 0,
      reference_number: expense.reference_number,
      expense_account: {
        id: expense.expense_account_id,
        name: expense.expense_account_name,
        code: expense.expense_account_code,
        type: expense.expense_account_type
      },
      transaction_status: expense.transaction_status,
      receipt_path: expense.receipt_path,
      receipt_original_name: expense.receipt_original_name,
      boarding_house: {
        id: expense.boarding_house_id,
        name: expense.boarding_house_name,
        location: expense.boarding_house_location
      },
      supplier: expense.supplier_id ? {
        id: expense.supplier_id,
        name: expense.supplier_name,
        contact: expense.supplier_contact,
        phone: expense.supplier_phone,
        address: expense.supplier_address
      } : null,
      created_at: expense.created_at,
      updated_at: expense.updated_at
    }));

    res.json({
      data: formattedExpenses,
      pagination: {
        total: expenses.length,
        page: 1,
        limit: expenses.length,
        total_pages: 1
      }
    });
  } catch (error) {
    console.error('Error in getAllExpenses:', error);
    console.log('Error details:', error.message);
    if (error.sql) {
      console.log('SQL Query:', error.sql);
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};