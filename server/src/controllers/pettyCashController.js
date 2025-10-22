const db = require('../services/db');

// Get petty cash account data for a specific user
exports.getPettyCashAccount = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    // Use user-id header if provided (for admin viewing other users), otherwise use logged-in user
    const userId = req.headers['user-id'] || req.user.id;
    const boardingHouseId = req.headers['boarding-house-id'] || req.user.boarding_house_id;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID is required' 
      });
    }
    
    if (!boardingHouseId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Boarding house ID is required' 
      });
    }

    // Get current petty cash balance for the specific user
    const [balanceResult] = await connection.query(
      `SELECT 
        COALESCE(current_balance, 0) as current_balance,
        COALESCE(beginning_balance, 0) as beginning_balance,
        COALESCE(total_inflows, 0) as total_inflows,
        COALESCE(total_outflows, 0) as total_outflows,
        account_name,
        account_code,
        status
       FROM petty_cash_accounts 
       WHERE petty_cash_user_id = ? AND boarding_house_id = ?`,
      [userId, boardingHouseId]
    );

    let accountData = {
      current_balance: 0,
      beginning_balance: 0,
      total_inflows: 0,
      total_outflows: 0,
      account_name: `Petty Cash - ${req.user.username}`,
      account_code: `PC-${userId.toString().padStart(3, '0')}`,
      status: 'active'
    };

    if (balanceResult.length > 0) {
      accountData = balanceResult[0];
    } else {
      // Create account if it doesn't exist
      await connection.query(
        `INSERT INTO petty_cash_accounts 
         (petty_cash_user_id, boarding_house_id, account_name, account_code, current_balance, beginning_balance, total_inflows, total_outflows, status, created_by) 
         VALUES (?, ?, ?, ?, 0, 0, 0, 0, 'active', ?)`,
        [userId, boardingHouseId, accountData.account_name, accountData.account_code, userId]
      );
    }

    // Get recent transactions for the specific user (by petty_cash_user_id only)
    const [transactionsResult] = await connection.query(
      `SELECT 
        id,
        transaction_type,
        amount,
        description,
        reference_number,
        transaction_date,
        notes,
        created_at
       FROM petty_cash_transactions 
       WHERE petty_cash_user_id = ? 
       ORDER BY transaction_date DESC, id DESC 
       LIMIT 50`,
      [userId]
    );
    
    console.log('Fetching transactions for user:', userId, '(no boarding house filter)');
    console.log('Found transactions:', transactionsResult.length);
    console.log('Transaction types found:', transactionsResult.map(t => t.transaction_type));
    console.log('Transaction IDs found:', transactionsResult.map(t => t.id));

    // Calculate running balance for transactions (most recent first)
    let runningBalance = parseFloat(accountData.current_balance);
    const transactionsWithBalance = transactionsResult.map(transaction => {
      const amount = parseFloat(transaction.amount);
      if (transaction.transaction_type === 'cash_inflow' || transaction.transaction_type === 'student_payment') {
        runningBalance -= amount; // Subtract inflows to get balance before this transaction
      } else if (transaction.transaction_type === 'cash_outflow' || transaction.transaction_type === 'withdrawal' || transaction.transaction_type === 'expense') {
        runningBalance += amount; // Add outflows to get balance before this transaction
      } else {
        runningBalance += amount; // Add outflows to get balance before this transaction
      }
      return {
        ...transaction,
        running_balance: runningBalance + amount // Add back the current transaction amount
      };
    });

    res.json({
      success: true,
      current_balance: parseFloat(accountData.current_balance),
      beginning_balance: parseFloat(accountData.beginning_balance),
      total_inflows: parseFloat(accountData.total_inflows),
      total_outflows: parseFloat(accountData.total_outflows),
      transactions: transactionsWithBalance
    });

  } catch (error) {
    console.error('Error fetching petty cash account:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch petty cash account data'
    });
  } finally {
    connection.release();
  }
};

// Add cash to petty cash account
exports.addCash = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { amount, description, transaction_date, reference_number, notes, source_account, user_id, account_id } = req.body;
    const created_by = req.user.id;
    
    // Use provided user_id for admin operations, otherwise use logged-in user
    const targetUserId = user_id || req.user.id;
    
    // Get boarding house ID from the target user
    const [userCheck] = await connection.query(
      'SELECT id, boarding_house_id FROM users WHERE id = ? AND deleted_at IS NULL',
      [targetUserId]
    );
    
    if (userCheck.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID provided'
      });
    }
    
    const boardingHouseId = userCheck[0].boarding_house_id;
    
    if (!boardingHouseId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User does not have an assigned boarding house'
      });
    }
    
    // If account_id is provided, verify it belongs to the user
    if (account_id) {
      const [accountCheck] = await connection.query(
        'SELECT id FROM petty_cash_accounts WHERE id = ? AND user_id = ?',
        [account_id, targetUserId]
      );
      
      if (accountCheck.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid account ID provided'
        });
      }
    }
    
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

    if (!source_account) {
      return res.status(400).json({ 
        success: false, 
        message: 'Source account is required. Where is the money coming from?' 
      });
    }

    const cashAmount = parseFloat(amount);
    
    // Get source account details
    const [sourceAccountResult] = await connection.query(
      `SELECT id, code, name, type FROM chart_of_accounts WHERE code = ? AND deleted_at IS NULL`,
      [source_account]
    );

    if (sourceAccountResult.length === 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid source account code: ${source_account}`
      });
    }

    const sourceAccount = sourceAccountResult[0];

    // Validate that source account is an asset account (cash, bank, etc.)
    if (sourceAccount.type !== 'Asset') {
      return res.status(400).json({
        success: false,
        message: `Source account must be an Asset account. ${sourceAccount.name} is a ${sourceAccount.type} account.`
      });
    }

    // Create main transaction record
    const [mainTransactionResult] = await connection.query(
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
        'petty_cash_addition',
        reference_number || `PCA-${Date.now()}`,
        cashAmount,
        'USD',
        `Petty Cash Addition: ${description}`,
        transaction_date || new Date().toISOString().split('T')[0],
        boardingHouseId,
        created_by
      ]
    );
    
    // Create petty cash transaction record
    const [transactionResult] = await connection.query(
      `INSERT INTO petty_cash_transactions 
       (user_id, boarding_house_id, transaction_type, amount, description, reference_number, notes, transaction_date, created_by, created_at)
       VALUES (?, ?, 'cash_inflow', ?, ?, ?, ?, ?, ?, NOW())`,
      [targetUserId, boardingHouseId, cashAmount, description, reference_number, notes, transaction_date || new Date().toISOString().split('T')[0], created_by]
    );
    
    console.log('Created petty cash transaction with ID:', transactionResult.insertId);
    console.log('Transaction details - User ID:', targetUserId, 'Amount:', cashAmount, 'Type: cash_inflow');
    console.log('Transaction boarding house ID:', boardingHouseId);
    
    // Get user details for account name
    const [userDetails] = await connection.query(
      'SELECT username FROM users WHERE id = ?',
      [targetUserId]
    );
    
    const accountName = `Petty Cash - ${userDetails[0]?.username || 'User'}`;
    const accountCode = `PC-${targetUserId.toString().padStart(3, '0')}`;
    
    // Update the specific petty cash account
    if (account_id) {
      // Update existing specific account
      console.log('Updating specific account ID:', account_id);
    await connection.query(
        `UPDATE petty_cash_accounts 
         SET current_balance = current_balance + ?,
       total_inflows = total_inflows + ?,
             updated_at = NOW()
         WHERE id = ?`,
        [cashAmount, cashAmount, account_id]
      );
    } else {
      // Fallback: find or create account for user
      const [existingAccount] = await connection.query(
        'SELECT id, current_balance FROM petty_cash_accounts WHERE user_id = ? AND boarding_house_id = ?',
        [targetUserId, boardingHouseId]
      );
      
      if (existingAccount.length > 0) {
        // Update first found account
        console.log('Updating first found account for user');
        await connection.query(
          `UPDATE petty_cash_accounts 
           SET current_balance = current_balance + ?,
               total_inflows = total_inflows + ?,
               updated_at = NOW()
           WHERE id = ?`,
          [cashAmount, cashAmount, existingAccount[0].id]
        );
      } else {
        // Create new account
        console.log('Creating new account for user');
        await connection.query(
          `INSERT INTO petty_cash_accounts (user_id, boarding_house_id, account_name, account_code, current_balance, total_inflows, created_at, created_by)
           VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)`,
          [targetUserId, boardingHouseId, accountName, accountCode, cashAmount, cashAmount, created_by]
        );
      }
    }

    // Create journal entries for proper double-entry bookkeeping
    // 1. Debit petty cash account
    const [pettyCashAccountResult] = await connection.query(
      `SELECT id FROM chart_of_accounts WHERE code = '10001' AND deleted_at IS NULL`
    );

    if (pettyCashAccountResult.length > 0) {
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
          mainTransactionResult.insertId,
          pettyCashAccountResult[0].id,
          cashAmount,
          `Petty Cash Addition: ${description}`,
          boardingHouseId,
          created_by
        ]
      );
    }

    // 2. Credit the source account (Cash, Bank, etc.)
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
        mainTransactionResult.insertId,
        sourceAccount.id,
        cashAmount,
        `Petty Cash Addition from ${sourceAccount.name}`,
        boardingHouseId,
        created_by
      ]
    );

    // Update current account balances
    // Update petty cash balance
    await connection.query(
      `INSERT INTO current_account_balances (account_id, account_code, account_name, account_type, current_balance, total_debits, total_credits, transaction_count, last_transaction_date)
       VALUES (?, '10001', 'Petty Cash', 'Asset', ?, ?, 0, 1, ?)
       ON DUPLICATE KEY UPDATE 
       current_balance = current_balance + ?,
       total_debits = total_debits + ?,
       transaction_count = transaction_count + 1,
       last_transaction_date = ?,
       updated_at = NOW()`,
      [
        pettyCashAccountResult[0].id,
        cashAmount,
        cashAmount,
        transaction_date || new Date().toISOString().split('T')[0],
        cashAmount,
        cashAmount,
        transaction_date || new Date().toISOString().split('T')[0]
      ]
    );

    // Update source account balance
    await connection.query(
      `INSERT INTO current_account_balances (account_id, account_code, account_name, account_type, current_balance, total_debits, total_credits, transaction_count, last_transaction_date)
       VALUES (?, ?, ?, ?, 0, 0, ?, 1, ?)
       ON DUPLICATE KEY UPDATE 
       current_balance = current_balance - ?,
       total_credits = total_credits + ?,
       transaction_count = transaction_count + 1,
       last_transaction_date = ?,
       updated_at = NOW()`,
      [
        sourceAccount.id,
        sourceAccount.code,
        sourceAccount.name,
        sourceAccount.type,
        cashAmount,
        transaction_date || new Date().toISOString().split('T')[0],
        cashAmount,
        cashAmount,
        transaction_date || new Date().toISOString().split('T')[0]
      ]
    );
    
    // Verify the balance was updated correctly
    let verificationQuery, verificationParams;
    if (account_id) {
      verificationQuery = 'SELECT current_balance FROM petty_cash_accounts WHERE id = ?';
      verificationParams = [account_id];
    } else {
      verificationQuery = 'SELECT current_balance FROM petty_cash_accounts WHERE user_id = ? AND boarding_house_id = ?';
      verificationParams = [targetUserId, boardingHouseId];
    }
    
    const [updatedAccount] = await connection.query(verificationQuery, verificationParams);
    
    console.log('Updated account balance:', updatedAccount[0]?.current_balance);
    
    await connection.commit();
    
    res.json({
      success: true,
      message: `Cash added successfully from ${sourceAccount.name}`,
      transaction_id: mainTransactionResult.insertId,
      petty_cash_transaction_id: transactionResult.insertId,
      source_account: {
        code: sourceAccount.code,
        name: sourceAccount.name,
        type: sourceAccount.type
      },
      amount: cashAmount
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error adding cash:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add cash to petty cash account'
    });
  } finally {
    connection.release();
  }
};

// Withdraw cash from petty cash account
exports.withdrawCash = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    console.log('=== WITHDRAW CASH REQUEST ===');
    console.log('Request body:', req.body);
    console.log('User:', req.user);
    console.log('Headers:', req.headers);
    console.log('=============================');
    
    await connection.beginTransaction();
    
    const { amount, purpose, transaction_date, reference_number, notes, destination_account, user_id, account_id } = req.body;
    const created_by = req.user.id;
    
    // Use provided user_id for admin operations, otherwise use logged-in user
    const targetUserId = user_id || req.user.id;
    
    // Get boarding house ID from the target user
    const [userCheck] = await connection.query(
      'SELECT id, boarding_house_id FROM users WHERE id = ? AND deleted_at IS NULL',
      [targetUserId]
    );
    
    if (userCheck.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID provided'
      });
    }
    
    const boardingHouseId = userCheck[0].boarding_house_id;
    console.log('User boarding house ID:', boardingHouseId);
    
    if (!boardingHouseId) {
      console.log('ERROR: User has no boarding house assigned');
      return res.status(400).json({ 
        success: false, 
        message: 'User does not have an assigned boarding house'
      });
    }
    
    console.log('Validation checks:');
    console.log('- amount:', amount);
    console.log('- purpose:', purpose);
    console.log('- destination_account:', destination_account);
    console.log('- user_id:', user_id);
    console.log('- targetUserId:', targetUserId);
    
    if (!amount || amount <= 0) {
      console.log('ERROR: Invalid amount:', amount);
      return res.status(400).json({ 
        success: false, 
        message: 'Valid amount is required' 
      });
    }
    
    if (!purpose) {
      console.log('ERROR: Purpose is missing');
      return res.status(400).json({ 
        success: false, 
        message: 'Purpose is required' 
      });
    }

    if (!destination_account) {
      console.log('ERROR: Destination account is missing');
      return res.status(400).json({ 
        success: false, 
        message: 'Destination account is required. Where is the withdrawn money going?' 
      });
    }

    const withdrawAmount = parseFloat(amount);
    console.log('Withdraw amount parsed:', withdrawAmount);
    
    // Check current balance for the specific account
    console.log('Checking balance for account_id:', account_id, 'user:', targetUserId);
    let balanceResult;
    let currentBalance = 0;
    
    if (account_id) {
      // Use specific account_id if provided
      [balanceResult] = await connection.query(
        `SELECT current_balance FROM petty_cash_accounts WHERE id = ? AND user_id = ?`,
        [account_id, targetUserId]
      );
      console.log('Balance query result (by account_id):', balanceResult);
    } else {
      // Fallback to user_id and boarding_house_id
      [balanceResult] = await connection.query(
        `SELECT current_balance FROM petty_cash_accounts WHERE user_id = ? AND boarding_house_id = ?`,
        [targetUserId, boardingHouseId]
      );
      console.log('Balance query result (by user_id):', balanceResult);
    }
    
    currentBalance = balanceResult.length > 0 ? parseFloat(balanceResult[0].current_balance) : 0;
    console.log('Current balance:', currentBalance, 'Withdraw amount:', withdrawAmount);
    
    if (currentBalance < withdrawAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Current balance: $${currentBalance.toFixed(2)}`
      });
    }

    // Get destination account details
    const [destinationAccountResult] = await connection.query(
      `SELECT id, code, name, type FROM chart_of_accounts WHERE code = ? AND deleted_at IS NULL`,
      [destination_account]
    );

    if (destinationAccountResult.length === 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid destination account code: ${destination_account}`
      });
    }

    const destinationAccount = destinationAccountResult[0];

    // Validate that destination account is an asset account (cash, bank, etc.)
    if (destinationAccount.type !== 'Asset') {
      return res.status(400).json({
        success: false,
        message: `Destination account must be an Asset account. ${destinationAccount.name} is a ${destinationAccount.type} account.`
      });
    }

    // Create main transaction record
    const [mainTransactionResult] = await connection.query(
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
        'petty_cash_withdrawal',
        reference_number || `PCW-${Date.now()}`,
        withdrawAmount,
        'USD',
        `Petty Cash Withdrawal: ${purpose}`,
        transaction_date || new Date().toISOString().split('T')[0],
        boardingHouseId,
        created_by
      ]
    );

    // Create petty cash transaction record
    const [pettyCashTransactionResult] = await connection.query(
      `INSERT INTO petty_cash_transactions 
       (user_id, boarding_house_id, transaction_type, amount, description, reference_number, notes, transaction_date, created_by, created_at)
       VALUES (?, ?, 'cash_outflow', ?, ?, ?, ?, ?, ?, NOW())`,
      [targetUserId, boardingHouseId, withdrawAmount, purpose, reference_number, notes, transaction_date || new Date().toISOString().split('T')[0], created_by]
    );
    
    // Get user details for account name
    const [userDetails] = await connection.query(
      'SELECT username FROM users WHERE id = ?',
      [targetUserId]
    );
    
    const accountName = `Petty Cash - ${userDetails[0]?.username || 'User'}`;
    const accountCode = `PC-${targetUserId.toString().padStart(3, '0')}`;
    
    // Update petty cash account balance for the specific account
    if (account_id) {
      // Update specific account by account_id
      console.log('Updating specific account ID:', account_id);
    await connection.query(
        `UPDATE petty_cash_accounts 
         SET current_balance = current_balance - ?,
             total_outflows = total_outflows + ?,
             updated_at = NOW()
         WHERE id = ?`,
        [withdrawAmount, withdrawAmount, account_id]
      );
    } else {
      // Fallback: Update or create account by user_id and boarding_house_id
      await connection.query(
        `INSERT INTO petty_cash_accounts (user_id, boarding_house_id, account_name, account_code, current_balance, total_outflows, created_at, created_by)
         VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)
       ON DUPLICATE KEY UPDATE 
       current_balance = current_balance - ?,
       total_outflows = total_outflows + ?,
       updated_at = NOW()`,
        [targetUserId, boardingHouseId, accountName, accountCode, currentBalance - withdrawAmount, withdrawAmount, created_by, withdrawAmount, withdrawAmount]
    );
    }

    // Create journal entries for proper double-entry bookkeeping
    // 1. Debit the destination account (Cash, Bank, etc.)
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
        mainTransactionResult.insertId,
        destinationAccount.id,
        withdrawAmount,
        `Petty Cash Withdrawal to ${destinationAccount.name}`,
        boardingHouseId,
        created_by
      ]
    );

    // 2. Credit petty cash account
    const [pettyCashAccountResult] = await connection.query(
      `SELECT id FROM chart_of_accounts WHERE code = '10001' AND deleted_at IS NULL`
    );

    if (pettyCashAccountResult.length > 0) {
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
          mainTransactionResult.insertId,
          pettyCashAccountResult[0].id,
          withdrawAmount,
          `Petty Cash Withdrawal: ${purpose}`,
          boardingHouseId,
          created_by
        ]
      );
    }

    // Update current account balances
    // Update petty cash balance
    await connection.query(
      `INSERT INTO current_account_balances (account_id, account_code, account_name, account_type, current_balance, total_debits, total_credits, transaction_count, last_transaction_date)
       VALUES (?, '10001', 'Petty Cash', 'Asset', ?, 0, ?, 1, ?)
       ON DUPLICATE KEY UPDATE 
       current_balance = current_balance - ?,
       total_credits = total_credits + ?,
       transaction_count = transaction_count + 1,
       last_transaction_date = ?,
       updated_at = NOW()`,
      [
        pettyCashAccountResult[0].id,
        currentBalance - withdrawAmount,
        withdrawAmount,
        transaction_date || new Date().toISOString().split('T')[0],
        withdrawAmount,
        withdrawAmount,
        transaction_date || new Date().toISOString().split('T')[0]
      ]
    );

    // Update destination account balance
    await connection.query(
      `INSERT INTO current_account_balances (account_id, account_code, account_name, account_type, current_balance, total_debits, total_credits, transaction_count, last_transaction_date)
       VALUES (?, ?, ?, ?, ?, ?, 0, 1, ?)
       ON DUPLICATE KEY UPDATE 
       current_balance = current_balance + ?,
       total_debits = total_debits + ?,
       transaction_count = transaction_count + 1,
       last_transaction_date = ?,
       updated_at = NOW()`,
      [
        destinationAccount.id,
        destinationAccount.code,
        destinationAccount.name,
        destinationAccount.type,
        withdrawAmount,
        withdrawAmount,
        transaction_date || new Date().toISOString().split('T')[0],
        withdrawAmount,
        withdrawAmount,
        transaction_date || new Date().toISOString().split('T')[0]
      ]
    );
    
    await connection.commit();
    
    res.json({
      success: true,
      message: `Cash withdrawn successfully from petty cash to ${destinationAccount.name}`,
      transaction_id: mainTransactionResult.insertId,
      petty_cash_transaction_id: pettyCashTransactionResult.insertId,
      destination_account: {
        code: destinationAccount.code,
        name: destinationAccount.name,
        type: destinationAccount.type
      },
      amount: withdrawAmount,
      new_petty_cash_balance: currentBalance - withdrawAmount
    });

  } catch (error) {
    await connection.rollback();
    console.error('=== ERROR in withdrawCash ===');
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Request body:', req.body);
    console.error('User:', req.user);
    console.error('===============================');
    res.status(500).json({
      success: false,
      message: 'Failed to withdraw cash from petty cash account',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Add expense from petty cash account
exports.addExpense = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const userId = req.user.id;
    const boardingHouseId = req.headers['boarding-house-id'] || req.user.boarding_house_id;
    const { 
      amount, 
      description, 
      transaction_date,
      expense_category, 
      vendor_name, 
      receipt_number, 
      notes 
    } = req.body;
    const created_by = req.user.id;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID is required' 
      });
    }
    
    if (!boardingHouseId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Boarding house ID is required' 
      });
    }
    
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

    const expenseAmount = parseFloat(amount);
    
    // Check current balance for the specific user
    const [balanceResult] = await connection.query(
      `SELECT current_balance FROM petty_cash_accounts WHERE user_id = ? AND boarding_house_id = ?`,
      [userId, boardingHouseId]
    );
    
    const currentBalance = balanceResult.length > 0 ? parseFloat(balanceResult[0].current_balance) : 0;
    
    if (currentBalance < expenseAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Current balance: $${currentBalance.toFixed(2)}`
      });
    }
    
    // Create transaction record
    const [transactionResult] = await connection.query(
      `INSERT INTO petty_cash_transactions 
       (user_id, boarding_house_id, transaction_type, amount, description, reference_number, notes, transaction_date, created_by, created_at)
       VALUES (?, ?, 'expense', ?, ?, ?, ?, ?, ?, NOW())`,
      [userId, boardingHouseId, expenseAmount, description, receipt_number, notes, transaction_date || new Date().toISOString().split('T')[0], created_by]
    );
    
    // Update account balance for the specific user
    await connection.query(
      `UPDATE petty_cash_accounts 
       SET current_balance = current_balance - ?,
       total_outflows = total_outflows + ?,
           updated_at = NOW()
       WHERE user_id = ? AND boarding_house_id = ?`,
      [expenseAmount, expenseAmount, userId, boardingHouseId]
    );
    
    // Also create an expense record for reporting
    await connection.query(
      `INSERT INTO expenses 
       (boarding_house_id, amount, description, expense_category, vendor_name, receipt_number, notes, payment_method, status, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'petty_cash', 'paid', ?, NOW())`,
      [boardingHouseId, expenseAmount, description, expense_category, vendor_name, receipt_number, notes, created_by]
    );
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Expense added successfully',
      transaction_id: transactionResult.insertId
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error adding expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add expense from petty cash account'
    });
  } finally {
    connection.release();
  }
};

// Set beginning balance for petty cash account
exports.setBeginningBalance = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const boardingHouseId = req.headers['boarding-house-id'] || req.user.boarding_house_id;
    const { beginning_balance } = req.body;
    const created_by = req.user.id;
    
    if (!boardingHouseId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Boarding house ID is required' 
      });
    }
    
    if (!beginning_balance || beginning_balance < 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid beginning balance is required' 
      });
    }

    const balance = parseFloat(beginning_balance);
    
    // Update or create account with beginning balance
    await connection.query(
      `INSERT INTO petty_cash_accounts 
       (boarding_house_id, beginning_balance, current_balance, created_at)
       VALUES (?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE 
       beginning_balance = ?,
       updated_at = NOW()`,
      [boardingHouseId, balance, balance, balance]
    );
    
    // Create main transaction record for proper double-entry bookkeeping
    const [mainTransactionResult] = await connection.query(
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
        'beginning_balance',
        `BB-${Date.now()}`,
        balance,
        'USD',
        `Beginning Balance Set: Petty Cash`,
        new Date().toISOString().split('T')[0],
        boardingHouseId,
        created_by
      ]
    );

    // Get Petty Cash account ID from chart of accounts
    const [pettyCashAccountResult] = await connection.query(
      `SELECT id FROM chart_of_accounts WHERE code = '10001' AND deleted_at IS NULL`
    );

    if (pettyCashAccountResult.length === 0) {
      throw new Error('Petty Cash account (10001) not found in chart of accounts');
    }

    const pettyCashAccountId = pettyCashAccountResult[0].id;

    // Create journal entries for proper double-entry bookkeeping
    // 1. Debit the Petty Cash account (money arrives)
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
        mainTransactionResult.insertId,
        pettyCashAccountId,
        balance,
        `Beginning Balance Set: Petty Cash`,
        boardingHouseId,
        created_by
      ]
    );

    // 2. Credit Opening Balance Equity account (30004)
    const [equityAccountResult] = await connection.query(
      `SELECT id FROM chart_of_accounts WHERE code = '30004' AND deleted_at IS NULL`
    );

    let equityAccountId;
    if (equityAccountResult.length === 0) {
      // Create Opening Balance Equity account if it doesn't exist
      const [newEquityAccount] = await connection.query(
        `INSERT INTO chart_of_accounts (code, name, type, is_category, created_by, created_at, updated_at) 
         VALUES (?, 'Opening Balance Equity', 'Equity', false, ?, NOW(), NOW())`,
        ['30004', created_by]
      );
      equityAccountId = newEquityAccount.insertId;
    } else {
      equityAccountId = equityAccountResult[0].id;
    }

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
        mainTransactionResult.insertId,
        equityAccountId,
        balance,
        `Beginning Balance for Petty Cash`,
        boardingHouseId,
        created_by
      ]
    );

    // Update current account balances for Petty Cash
    await connection.query(
      `INSERT INTO current_account_balances (account_id, account_code, account_name, account_type, current_balance, total_debits, total_credits, transaction_count, last_transaction_date)
       VALUES (?, '10001', 'Petty Cash', 'Asset', ?, ?, 0, 1, ?)
       ON DUPLICATE KEY UPDATE 
       current_balance = ?,
       total_debits = ?,
       transaction_count = transaction_count + 1,
       last_transaction_date = ?,
       updated_at = NOW()`,
      [
        pettyCashAccountId,
        balance,
        balance,
        new Date().toISOString().split('T')[0],
        balance,
        balance,
        new Date().toISOString().split('T')[0]
      ]
    );

    // Create petty cash transaction record for tracking
    await connection.query(
      `INSERT INTO petty_cash_transactions 
       (boarding_house_id, transaction_type, amount, description, transaction_date, created_by, created_at)
       VALUES (?, 'beginning_balance', ?, 'Beginning balance set', CURDATE(), ?, NOW())`,
      [boardingHouseId, balance, created_by]
    );
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Beginning balance set successfully'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error setting beginning balance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set beginning balance'
    });
  } finally {
    connection.release();
  }
};

// Create new petty cash account
exports.createAccount = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { username, boarding_house_id, account_name, initial_balance, password, notes } = req.body;
    const created_by = req.user.id;
    
    // Validate required fields
    if (!username || !boarding_house_id || !account_name || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username, boarding house ID, account name, and password are required' 
      });
    }
    
    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters long' 
      });
    }
    
    // Check if username already exists in petty_cash_users
    const [existingUser] = await connection.query(
      'SELECT id FROM petty_cash_users WHERE username = ? AND deleted_at IS NULL',
      [username]
    );
    
    if (existingUser.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username already exists' 
      });
    }
    
    // Hash the password
    const bcrypt = require('bcrypt');
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Create new petty cash user
    const [userResult] = await connection.query(
      `INSERT INTO petty_cash_users (username, password, boarding_house_id, created_by, created_at) 
       VALUES (?, ?, ?, ?, NOW())`,
      [username, hashedPassword, boarding_house_id, created_by]
    );
    
    const petty_cash_user_id = userResult.insertId;
    
    // Generate account code
    const accountCode = `PC-${petty_cash_user_id.toString().padStart(3, '0')}`;
    const balance = parseFloat(initial_balance) || 0;
    
    // Create the petty cash account
    const [accountResult] = await connection.query(
      `INSERT INTO petty_cash_accounts (
        petty_cash_user_id, boarding_house_id, account_name, account_code, 
        initial_balance, current_balance, total_inflows, 
        created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [petty_cash_user_id, boarding_house_id, account_name, accountCode, balance, balance, balance, created_by]
    );
    
    // If there's an initial balance, create a transaction record
    if (balance > 0) {
      // Create transaction record
      const [transactionResult] = await connection.query(
        `INSERT INTO transactions (
          transaction_type, reference, amount, currency, description,
          transaction_date, boarding_house_id, created_by, created_at, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'posted')`,
        [
          'beginning_balance',
          `PC-${accountResult.insertId}-${Date.now()}`,
          balance,
          'USD',
          `Initial balance for ${account_name}`,
          new Date().toISOString().split('T')[0],
          boarding_house_id,
          created_by
        ]
      );
      
      // Create journal entries for proper double-entry bookkeeping
      const [pettyCashAccountResult] = await connection.query(
        `SELECT id FROM chart_of_accounts WHERE code = '10001' AND deleted_at IS NULL`
      );
      
      // Get Owner's Equity account for the credit side
      const [equityAccountResult] = await connection.query(
        `SELECT id FROM chart_of_accounts WHERE code = '30001' AND deleted_at IS NULL`
      );
      
      if (pettyCashAccountResult.length > 0 && equityAccountResult.length > 0) {
        // Debit: Petty Cash (Asset increases)
        await connection.query(
          `INSERT INTO journal_entries (
            transaction_id, account_id, entry_type, amount, description,
            boarding_house_id, created_by, created_at
          ) VALUES (?, ?, 'debit', ?, ?, ?, ?, NOW())`,
          [
            transactionResult.insertId,
            pettyCashAccountResult[0].id,
            balance,
            `Initial balance for ${account_name}`,
            boarding_house_id,
            created_by
          ]
        );
        
        // Credit: Owner's Equity (Equity increases)
        await connection.query(
          `INSERT INTO journal_entries (
            transaction_id, account_id, entry_type, amount, description,
            boarding_house_id, created_by, created_at
          ) VALUES (?, ?, 'credit', ?, ?, ?, ?, NOW())`,
          [
            transactionResult.insertId,
            equityAccountResult[0].id,
            balance,
            `Initial balance for ${account_name}`,
            boarding_house_id,
            created_by
          ]
        );
        
        // Update account balances
        await connection.query(
          `INSERT INTO current_account_balances (account_id, account_code, account_name, account_type, current_balance, total_debits, total_credits, transaction_count, last_transaction_date)
           VALUES (?, '10001', 'Petty Cash', 'Asset', ?, ?, 0, 1, ?)
           ON DUPLICATE KEY UPDATE 
           current_balance = current_balance + ?,
           total_debits = total_debits + ?,
           transaction_count = transaction_count + 1,
           last_transaction_date = ?,
           updated_at = NOW()`,
          [
            pettyCashAccountResult[0].id,
            balance,
            balance,
            new Date().toISOString().split('T')[0],
            balance,
            balance,
            new Date().toISOString().split('T')[0]
          ]
        );
        
        await connection.query(
          `INSERT INTO current_account_balances (account_id, account_code, account_name, account_type, current_balance, total_debits, total_credits, transaction_count, last_transaction_date)
           VALUES (?, '30001', 'Owner\'s Equity', 'Equity', ?, 0, ?, 1, ?)
           ON DUPLICATE KEY UPDATE 
           current_balance = current_balance + ?,
           total_credits = total_credits + ?,
           transaction_count = transaction_count + 1,
           last_transaction_date = ?,
           updated_at = NOW()`,
          [
            equityAccountResult[0].id,
            balance,
            balance,
            new Date().toISOString().split('T')[0],
            balance,
            balance,
            new Date().toISOString().split('T')[0]
          ]
        );
      }
    }
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Petty cash account created successfully',
      account_id: accountResult.insertId
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error creating petty cash account:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create petty cash account'
    });
  } finally {
    connection.release();
  }
};