const db = require('../services/db');
const { updateAccountBalance } = require('../services/accountBalanceService');

/**
 * Get all accounts payable data
 * This includes credit expenses that haven't been paid yet
 */
exports.getAccountsPayable = async (req, res) => {
  try {
    let query = `
      SELECT 
        je_credit.id,
        je_credit.transaction_id,
        je_credit.amount,
        je_credit.description,
        je_credit.created_at,
        coa_credit.name as payable_account_name,
        coa_credit.code as payable_account_code,
        coa_debit.name as expense_account_name,
        coa_debit.code as expense_account_code,
        bh.name as boarding_house_name,
        t.description as transaction_description
      FROM journal_entries je_credit
      LEFT JOIN chart_of_accounts coa_credit ON je_credit.account_id = coa_credit.id
      LEFT JOIN transactions t ON je_credit.transaction_id = t.id
      LEFT JOIN boarding_houses bh ON je_credit.boarding_house_id = bh.id
      LEFT JOIN journal_entries je_debit ON je_credit.transaction_id = je_debit.transaction_id 
        AND je_debit.entry_type = 'debit'
      LEFT JOIN chart_of_accounts coa_debit ON je_debit.account_id = coa_debit.id
      WHERE je_credit.entry_type = 'credit'
        AND coa_credit.type = 'Liability'
        AND coa_credit.code = '20001'
        AND je_credit.deleted_at IS NULL
      ORDER BY je_credit.created_at DESC
    `;
    
    const [accountsPayable] = await db.query(query);
    
    res.json({
      data: accountsPayable,
      message: 'Accounts payable retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching accounts payable:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get accounts payable summary/totals
 */
exports.getAccountsPayableSummary = async (req, res) => {
  try {
    let query = `
      SELECT 
        COUNT(*) as total_invoices,
        SUM(je.amount) as total_outstanding,
        SUM(je.amount) as pending_amount,
        0 as partial_amount,
        0 as overdue_count,
        0 as overdue_amount
      FROM journal_entries je
      LEFT JOIN chart_of_accounts coa ON je.account_id = coa.id
      WHERE je.entry_type = 'credit'
        AND coa.type = 'Liability'
        AND coa.code = '20001'
        AND je.deleted_at IS NULL
    `;
    
    const [summary] = await db.query(query);
    
    res.json({
      data: summary[0] || {
        total_invoices: 0,
        total_outstanding: 0,
        pending_amount: 0,
        partial_amount: 0,
        overdue_count: 0,
        overdue_amount: 0
      },
      message: 'Accounts payable summary retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching accounts payable summary:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Create a new accounts payable entry
 * This creates an expense with credit payment method and creates journal entries
 */
exports.createAccountsPayable = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const {
      supplier_id,
      invoice_number,
      invoice_date,
      due_date,
      amount,
      description,
      expense_category,
      reference_number,
      notes,
      boarding_house_id
    } = req.body;
    
    const boardingHouseId = boarding_house_id || req.user.boarding_house_id;
    const userId = req.user.id;
    
    // Validate required fields
    if (!invoice_date || !due_date || !amount || !description || !expense_category || !boardingHouseId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: invoice_date, due_date, amount, description, expense_category, boarding_house_id'
      });
    }
    
    // Handle optional fields
    const supplierId = supplier_id ? parseInt(supplier_id) : null;
    const invoiceNumber = invoice_number || `AP-${Date.now()}`; // Generate invoice number if not provided
    
    // Get the expense account details
    const [expenseAccount] = await connection.query(
      'SELECT id, name, code FROM chart_of_accounts WHERE id = ? AND type = "Expense"',
      [expense_category]
    );
    
    if (expenseAccount.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid expense category'
      });
    }
    
    // Get accounts payable account (liability)
    const [payableAccount] = await connection.query(
      'SELECT id FROM chart_of_accounts WHERE code = "20001" AND type = "Liability"'
    );
    
    if (payableAccount.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Accounts Payable account not found'
      });
    }
    
    const expenseAccountId = expenseAccount[0].id;
    const payableAccountId = payableAccount[0].id;
    
    // Create transaction record first
    const [transactionResult] = await connection.query(
      `INSERT INTO transactions (
        transaction_type, description, 
        boarding_house_id, created_by, created_at
      ) VALUES ('accounts_payable', ?, ?, ?, NOW())`,
      [description, boardingHouseId, userId]
    );
    
    const transactionId = transactionResult.insertId;
    
    // Create journal entries
    // Debit: Expense Account
    await connection.query(
      `INSERT INTO journal_entries (
        transaction_id, account_id, entry_type, amount, 
        description, boarding_house_id, created_by, created_at
      ) VALUES (?, ?, 'debit', ?, ?, ?, ?, NOW())`,
      [transactionId, expenseAccountId, amount, description, boardingHouseId, userId]
    );
    
    // Credit: Accounts Payable
    await connection.query(
      `INSERT INTO journal_entries (
        transaction_id, account_id, entry_type, amount, 
        description, boarding_house_id, created_by, created_at
      ) VALUES (?, ?, 'credit', ?, ?, ?, ?, NOW())`,
      [transactionId, payableAccountId, amount, description, boardingHouseId, userId]
    );
    
    // Update account balances
    await updateAccountBalance(
      expenseAccountId,
      amount,
      'debit',
      boardingHouseId,
      connection
    );
    
    await updateAccountBalance(
      payableAccountId,
      amount,
      'credit',
      boardingHouseId,
      connection
    );
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Accounts payable entry created successfully',
      data: {
        transaction_id: transactionId,
        amount: amount,
        expense_account_id: expenseAccountId,
        payable_account_id: payableAccountId
      }
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error creating accounts payable:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create accounts payable entry'
    });
  } finally {
    connection.release();
  }
};

/**
 * Get accounts payable for a specific supplier
 */
exports.getAccountsPayableBySupplier = async (req, res) => {
  try {
    const { supplierId } = req.params;
    const boardingHouseId = req.user?.boarding_house_id;
    
    const query = `
      SELECT 
        e.id,
        e.reference_number as invoice_number,
        e.expense_date as date,
        e.expense_date as due_date,
        e.total_amount as amount,
        e.remaining_balance as balance,
        CASE 
          WHEN e.payment_status = 'full' THEN 'paid'
          WHEN e.payment_status = 'partial' THEN 'partial'
          ELSE 'pending'
        END as status,
        e.description,
        e.payment_method,
        e.notes,
        e.created_at,
        coa.name as account_name,
        s.company as supplier_name,
        s.contact_person as supplier_contact
      FROM expenses e
      LEFT JOIN chart_of_accounts coa ON e.expense_account_id = coa.id
      LEFT JOIN suppliers s ON e.supplier_id = s.id
      WHERE e.supplier_id = ?
        AND e.payment_method = 'credit'
        AND e.payment_status IN ('debt', 'partial')
        AND e.deleted_at IS NULL
        AND e.boarding_house_id = ?
      ORDER BY e.expense_date DESC, e.created_at DESC
    `;
    
    const [accountsPayable] = await db.query(query, [supplierId, boardingHouseId]);
    
    res.json({
      data: accountsPayable,
      message: 'Supplier accounts payable retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching supplier accounts payable:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Process payment for accounts payable
 * This creates journal entries to reduce accounts payable and reduce cash/bank
 */
exports.processAccountsPayablePayment = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const {
      accounts_payable_id,
      transaction_id,
      amount,
      payment_method,
      payment_date,
      reference_number,
      notes,
      boarding_house_id,
      petty_cash_account_id
    } = req.body;
    
    const userId = req.user.id;
    const finalBoardingHouseId = boarding_house_id || req.user.boarding_house_id;
    
    // Validate required fields
    if (!accounts_payable_id || !transaction_id || !amount || !payment_method || !payment_date) {
      return res.status(400).json({ 
        message: 'Missing required fields: accounts_payable_id, transaction_id, amount, payment_method, payment_date' 
      });
    }
    
    // Get the original accounts payable entry to verify amount
    const [payableEntry] = await connection.execute(
      'SELECT * FROM journal_entries WHERE id = ? AND transaction_id = ?',
      [accounts_payable_id, transaction_id]
    );
    
    if (payableEntry.length === 0) {
      return res.status(404).json({ message: 'Accounts payable entry not found' });
    }
    
    const payableAmount = payableEntry[0].amount;
    const paymentAmount = parseFloat(amount);
    
    // Check if payment amount is valid
    if (paymentAmount <= 0 || paymentAmount > payableAmount) {
      return res.status(400).json({ 
        message: `Payment amount must be between 0 and ${payableAmount}` 
      });
    }
    
    // Create payment transaction
    const [paymentTransaction] = await connection.execute(
      `INSERT INTO transactions (
        transaction_type, 
        description, 
        amount, 
        transaction_date, 
        boarding_house_id, 
        created_by
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        'accounts_payable_payment',
        `Payment for ${payableEntry[0].description || 'Accounts Payable'}`,
        paymentAmount,
        payment_date,
        finalBoardingHouseId,
        userId
      ]
    );
    
    const paymentTransactionId = paymentTransaction.insertId;
    
    // Determine the credit account based on payment method
    let creditAccountCode;
    
    if (payment_method === 'petty_cash' && petty_cash_account_id) {
      // Get petty cash account details
      const [pettyCashAccount] = await connection.execute(
        'SELECT * FROM petty_cash_accounts WHERE id = ?',
        [petty_cash_account_id]
      );
      
      if (pettyCashAccount.length === 0) {
        throw new Error('Petty cash account not found');
      }
      
      creditAccountCode = '10001'; // Petty Cash
    } else if (payment_method === 'cash') {
      // Use cash account (10002)
      creditAccountCode = '10002';
    } else if (payment_method === 'bank_transfer') {
      // Use bank account (10002) - same as cash for now
      creditAccountCode = '10002';
    } else {
      throw new Error(`Unsupported payment method: ${payment_method}`);
    }
    
    // Create journal entries for the payment
    // 1. Debit: Accounts Payable (reduce liability)
    await connection.execute(
      `INSERT INTO journal_entries (
        transaction_id, 
        account_id, 
        entry_type, 
        amount, 
        description, 
        boarding_house_id, 
        created_by
      ) VALUES (?, (SELECT id FROM chart_of_accounts WHERE code = '20001' AND deleted_at IS NULL LIMIT 1), ?, ?, ?, ?, ?)`,
      [
        paymentTransactionId,
        'debit',
        paymentAmount,
        `Payment for ${payableEntry[0].description || 'Accounts Payable'}`,
        finalBoardingHouseId,
        userId
      ]
    );
    
    // 2. Credit: Cash/Bank/Petty Cash (reduce asset)
    await connection.execute(
      `INSERT INTO journal_entries (
        transaction_id, 
        account_id, 
        entry_type, 
        amount, 
        description, 
        boarding_house_id, 
        created_by
      ) VALUES (?, (SELECT id FROM chart_of_accounts WHERE code = ? AND deleted_at IS NULL LIMIT 1), ?, ?, ?, ?, ?)`,
      [
        paymentTransactionId,
        creditAccountCode,
        'credit',
        paymentAmount,
        `Payment for ${payableEntry[0].description || 'Accounts Payable'}`,
        finalBoardingHouseId,
        userId
      ]
    );
    
    // Get account IDs for balance updates
    const [accountsPayableAccount] = await connection.execute(
      'SELECT id FROM chart_of_accounts WHERE code = "20001" AND deleted_at IS NULL LIMIT 1'
    );
    const [creditAccount] = await connection.execute(
      'SELECT id FROM chart_of_accounts WHERE code = ? AND deleted_at IS NULL LIMIT 1',
      [creditAccountCode]
    );
    
    if (accountsPayableAccount.length === 0) {
      throw new Error('Accounts Payable account (20001) not found');
    }
    if (creditAccount.length === 0) {
      throw new Error(`Credit account (${creditAccountCode}) not found`);
    }
    
    // Update account balances
    await updateAccountBalance(accountsPayableAccount[0].id, paymentAmount, 'debit', finalBoardingHouseId, connection); // Accounts Payable
    await updateAccountBalance(creditAccount[0].id, paymentAmount, 'credit', finalBoardingHouseId, connection); // Cash/Bank/Petty Cash
    
    // If payment method is petty cash, update petty cash balance
    if (payment_method === 'petty_cash' && petty_cash_account_id) {
      await connection.execute(
        'UPDATE petty_cash_accounts SET current_balance = current_balance - ? WHERE id = ?',
        [paymentAmount, petty_cash_account_id]
      );
      
      // Record petty cash transaction
      await connection.execute(
        `INSERT INTO petty_cash_transactions (
          account_id, 
          transaction_type, 
          amount, 
          description, 
          reference_number, 
          created_by
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          petty_cash_account_id,
          'payment',
          paymentAmount,
          `Payment for ${payableEntry[0].description || 'Accounts Payable'}`,
          reference_number || `PAY-${paymentTransactionId}`,
          userId
        ]
      );
    }
    
    await connection.commit();
    
    res.json({
      message: 'Payment processed successfully',
      payment_transaction_id: paymentTransactionId,
      amount_paid: paymentAmount,
      payment_method: payment_method,
      credit_account_code: creditAccountCode
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error processing accounts payable payment:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  } finally {
    connection.release();
  }
};