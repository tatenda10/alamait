const db = require('../services/db');

// Get all student payment transactions
exports.getStudentPayments = async (req, res) => {
  try {
    const { boarding_house_id, search } = req.query;

    let query = `
      SELECT 
        sp.*,
        s.full_name as student_name,
        r.name as room_name,
        sps.period_start_date,
        sps.period_end_date,
        se.boarding_house_id
      FROM student_payments sp
      JOIN student_enrollments se ON sp.enrollment_id = se.id
      JOIN students s ON sp.student_id = s.id
      JOIN rooms r ON se.room_id = r.id
      LEFT JOIN student_payment_schedules sps ON sp.schedule_id = sps.id
      WHERE sp.deleted_at IS NULL
    `;

    const params = [];

    if (boarding_house_id) {
      query += ' AND se.boarding_house_id = ?';
      params.push(boarding_house_id);
    }

    if (search) {
      query += ` AND (
        s.full_name LIKE ? OR
        sp.reference_number LIKE ? OR
        sp.payment_type LIKE ? OR
        r.name LIKE ?
      )`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    query += ' ORDER BY sp.payment_date DESC, sp.created_at DESC';

    const [payments] = await db.query(query, params);

    // Transform the data for frontend display
    const transformedPayments = payments.map(payment => ({
      id: payment.id,
      payment_date: payment.payment_date,
      reference_number: payment.reference_number,
      amount: payment.amount,
      payment_type: payment.payment_type,
      payment_method: payment.payment_method,
      status: payment.status,
      student_name: payment.student_name,
      room_name: payment.room_name,
      notes: payment.notes,
      period: payment.period_start_date && payment.period_end_date ? {
        start: payment.period_start_date,
        end: payment.period_end_date
      } : null,
      boarding_house_id: payment.boarding_house_id
    }));

    res.json({
      data: transformedPayments
    });
  } catch (error) {
    console.error('Error in getStudentPayments:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Create a new transaction with journal entries
exports.createTransaction = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { 
      transaction_date,
      posting_date,
      reference_no,
      description,
      journal_entries
    } = req.body;

    // Validate required fields
    if (!transaction_date || !posting_date || !reference_no || !journal_entries) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate journal entries
    if (!Array.isArray(journal_entries) || journal_entries.length < 2) {
      return res.status(400).json({ message: 'At least two journal entries are required' });
    }

    // Calculate and validate debits and credits
    const totalDebits = journal_entries.reduce((sum, entry) => sum + (entry.debit || 0), 0);
    const totalCredits = journal_entries.reduce((sum, entry) => sum + (entry.credit || 0), 0);

    if (Math.abs(totalDebits - totalCredits) > 0.01) { // Allow for small rounding differences
      return res.status(400).json({ message: 'Debits must equal credits' });
    }

    // Create transaction header
    const [result] = await connection.query(
      `INSERT INTO transactions (
        transaction_date,
        posting_date,
        reference_no,
        description,
        status,
        created_by,
        created_at
      ) VALUES (?, ?, ?, ?, 'draft', ?, NOW())`,
      [transaction_date, posting_date, reference_no, description, req.user.id]
    );

    const transactionId = result.insertId;

    // Create journal entries
    for (const entry of journal_entries) {
      await connection.query(
        `INSERT INTO journal_entries (
          transaction_id,
          account_id,
          debit,
          credit,
          description,
          created_at
        ) VALUES (?, ?, ?, ?, ?, NOW())`,
        [
          transactionId,
          entry.account_id,
          entry.debit || 0,
          entry.credit || 0,
          entry.description
        ]
      );
    }

    // Fetch the created transaction with its entries
    const [transaction] = await connection.query(
      `SELECT 
        t.*,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', je.id,
            'account_id', je.account_id,
            'debit', je.debit,
            'credit', je.credit,
            'description', je.description
          )
        ) as entries
      FROM transactions t
      LEFT JOIN journal_entries je ON t.id = je.transaction_id
      WHERE t.id = ?
      GROUP BY t.id`,
      [transactionId]
    );

    await connection.commit();
    res.status(201).json(transaction[0]);
  } catch (error) {
    await connection.rollback();
    console.error('Error in createTransaction:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
};

// Get account balance
exports.getAccountBalance = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { as_of_date } = req.query;

    const [balances] = await db.query(
      `SELECT 
        coa.id AS account_id,
        coa.code AS account_code,
        coa.name AS account_name,
        coa.type AS account_type,
        COALESCE(
          CASE 
            WHEN coa.type IN ('Asset', 'Expense') 
            THEN SUM(COALESCE(je.debit, 0) - COALESCE(je.credit, 0))
            ELSE SUM(COALESCE(je.credit, 0) - COALESCE(je.debit, 0))
          END,
          0
        ) AS balance
      FROM chart_of_accounts coa
      LEFT JOIN journal_entries je ON coa.id = je.account_id
      LEFT JOIN transactions t ON je.transaction_id = t.id 
        AND t.status = 'posted' 
        AND t.deleted_at IS NULL
        ${as_of_date ? 'AND t.posting_date <= ?' : ''}
      WHERE coa.id = ? 
        AND coa.deleted_at IS NULL
      GROUP BY coa.id, coa.code, coa.name, coa.type`,
      as_of_date ? [as_of_date, accountId] : [accountId]
    );

    if (balances.length === 0) {
      return res.status(404).json({ message: 'Account not found' });
    }

    res.json(balances[0]);
  } catch (error) {
    console.error('Error in getAccountBalance:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Post a transaction
exports.postTransaction = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;

    // Verify transaction exists and is in draft status
    const [transactions] = await connection.query(
      'SELECT * FROM transactions WHERE id = ? AND status = "draft" AND deleted_at IS NULL',
      [id]
    );

    if (transactions.length === 0) {
      return res.status(404).json({ message: 'Transaction not found or not in draft status' });
    }

    // Update transaction status to posted
    await connection.query(
      'UPDATE transactions SET status = "posted", updated_at = NOW() WHERE id = ?',
      [id]
    );

    await connection.commit();
    res.json({ message: 'Transaction posted successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error in postTransaction:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
};

// Void a transaction
exports.voidTransaction = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;

    // Verify transaction exists and is posted
    const [transactions] = await connection.query(
      'SELECT * FROM transactions WHERE id = ? AND status = "posted" AND deleted_at IS NULL',
      [id]
    );

    if (transactions.length === 0) {
      return res.status(404).json({ message: 'Transaction not found or not in posted status' });
    }

    // Update transaction status to voided
    await connection.query(
      'UPDATE transactions SET status = "voided", updated_at = NOW() WHERE id = ?',
      [id]
    );

    await connection.commit();
    res.json({ message: 'Transaction voided successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error in voidTransaction:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
};

// Get transactions by account
exports.getAccountTransactions = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { 
      start_date, 
      end_date, 
      limit = 50, 
      offset = 0,
      boarding_house_id 
    } = req.query;

    // Verify account exists
    const [accountCheck] = await db.query(
      `SELECT coa.*, b.name as boarding_house_name 
       FROM chart_of_accounts_branch coa
       LEFT JOIN boarding_houses b ON coa.branch_id = b.id
       WHERE coa.id = ? AND coa.deleted_at IS NULL`,
      [accountId]
    );

    if (accountCheck.length === 0) {
      return res.status(404).json({ message: 'Account not found' });
    }

    const account = accountCheck[0];

    // Build query conditions
    let whereConditions = ['je.account_id = ?', 't.deleted_at IS NULL'];
    let queryParams = [accountId];

    if (boarding_house_id) {
      whereConditions.push('t.boarding_house_id = ?');
      queryParams.push(boarding_house_id);
    }

    if (start_date && end_date) {
      whereConditions.push('DATE(t.transaction_date) BETWEEN ? AND ?');
      queryParams.push(start_date, end_date);
    }

    // Get transactions with journal entries
    const [transactions] = await db.query(
      `SELECT 
        t.id as transaction_id,
        t.transaction_date,
        t.reference as reference_no,
        t.description as transaction_description,
        t.status,
        t.transaction_type,
        je.id as journal_entry_id,
        je.entry_type,
        je.amount,
        je.description as entry_description,
        u.username as created_by_name,
        bh.name as boarding_house_name
      FROM transactions t
      INNER JOIN journal_entries je ON t.id = je.transaction_id
      LEFT JOIN users u ON t.created_by = u.id
      LEFT JOIN boarding_houses bh ON t.boarding_house_id = bh.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY t.transaction_date DESC, t.id DESC
      LIMIT ? OFFSET ?`,
      [...queryParams, parseInt(limit), parseInt(offset)]
    );

    // Get total count for pagination
    const [countResult] = await db.query(
      `SELECT COUNT(DISTINCT t.id) as total
       FROM transactions t
       INNER JOIN journal_entries je ON t.id = je.transaction_id
       WHERE ${whereConditions.join(' AND ')}`,
      queryParams
    );

    // Calculate running balance
    let runningBalance = 0;
    const transactionsWithBalance = transactions.map(transaction => {
      const amount = transaction.amount || 0;
      const isDebit = transaction.entry_type === 'debit';
      
      // For Asset and Expense accounts: debit increases, credit decreases
      // For Liability, Equity, Revenue accounts: credit increases, debit decreases
      if (account.type === 'Asset' || account.type === 'Expense') {
        runningBalance += isDebit ? amount : -amount;
      } else {
        runningBalance += isDebit ? -amount : amount;
      }

      return {
        ...transaction,
        debit: isDebit ? amount : 0,
        credit: isDebit ? 0 : amount,
        running_balance: runningBalance
      };
    });

    res.json({
      account: {
        id: account.id,
        code: account.code,
        name: account.name,
        type: account.type,
        boarding_house_name: account.boarding_house_name
      },
      transactions: transactionsWithBalance,
      pagination: {
        total: countResult[0].total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: countResult[0].total > parseInt(offset) + parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error in getAccountTransactions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};