const db = require('../services/db');

// Get account balances for a boarding house
exports.getAccountBalances = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const boardingHouseId = req.headers['boarding-house-id'] || req.user.boarding_house_id;
    
    if (!boardingHouseId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Boarding house ID is required' 
      });
    }

    // Get current account balances from COA - join with chart_of_accounts to ensure we get correct accounts
    // Cash and Bank accounts: 10001 (Petty Cash), 10002 (Cash), 10003 (CBZ Bank), 10004 (CBZ Vault)
    const [balancesResult] = await connection.query(
      `SELECT 
        coa.code as account_code,
        coa.name as account_name,
        coa.type as account_type,
        COALESCE(cab.current_balance, 0) as current_balance,
        COALESCE(cab.total_debits, 0) as total_debits,
        COALESCE(cab.total_credits, 0) as total_credits,
        cab.last_transaction_date
       FROM chart_of_accounts coa
       LEFT JOIN current_account_balances cab ON coa.id = cab.account_id
       WHERE coa.code IN ('10001', '10002', '10003', '10004')
         AND coa.deleted_at IS NULL
         AND coa.type = 'Asset'
       ORDER BY coa.code`
    );

    // Format balances into an object
    const balances = {};
    const accounts = [];
    
    balancesResult.forEach(balance => {
      const accountCode = balance.account_code;
      balances[accountCode] = parseFloat(balance.current_balance || 0);
      accounts.push({
        account_code: accountCode,
        account_name: balance.account_name,
        account_type: balance.account_type,
        current_balance: parseFloat(balance.current_balance || 0),
        total_debits: parseFloat(balance.total_debits || 0),
        total_credits: parseFloat(balance.total_credits || 0),
        last_transaction_date: balance.last_transaction_date
      });
    });

    // Ensure all cash and bank accounts exist (set to 0 if not found)
    const accountCodes = ['10001', '10002', '10003', '10004'];
    accountCodes.forEach(code => {
      if (!balances[code]) {
        balances[code] = 0;
      }
    });

    console.log('💰 Cash and Bank Account Balances from COA:', balances);

    res.json({
      success: true,
      balances: balances,
      accounts: accounts
    });

  } catch (error) {
    console.error('Error fetching account balances:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch account balances'
    });
  } finally {
    connection.release();
  }
};

// Get recent banking transactions
exports.getTransactions = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const boardingHouseId = req.headers['boarding-house-id'] || req.user.boarding_house_id;
    
    if (!boardingHouseId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Boarding house ID is required' 
      });
    }

    // Get recent transactions
    const [transactionsResult] = await connection.query(
      `SELECT 
        t.id,
        t.transaction_type,
        t.reference,
        t.amount,
        t.description,
        t.transaction_date,
        t.created_at,
        je_debit.account_id as debit_account_id,
        je_credit.account_id as credit_account_id,
        coa_debit.code as debit_account_code,
        coa_credit.code as credit_account_code
       FROM transactions t
       JOIN journal_entries je_debit ON t.id = je_debit.transaction_id AND je_debit.entry_type = 'debit'
       JOIN journal_entries je_credit ON t.id = je_credit.transaction_id AND je_credit.entry_type = 'credit'
       JOIN chart_of_accounts coa_debit ON je_debit.account_id = coa_debit.id
       JOIN chart_of_accounts coa_credit ON je_credit.account_id = coa_credit.id
       WHERE t.boarding_house_id = ?
         AND t.transaction_type IN ('banking_balance_addition', 'banking_transfer', 'opening_balance_set')
         AND t.deleted_at IS NULL
       ORDER BY t.transaction_date DESC, t.id DESC 
       LIMIT 50`,
      [boardingHouseId]
    );

    res.json({
      success: true,
      transactions: transactionsResult
    });

  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions'
    });
  } finally {
    connection.release();
  }
};

// Add balance to an account
exports.addBalance = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const boardingHouseId = req.headers['boarding-house-id'] || req.user.boarding_house_id;
    const { account_code, amount, description, source_account, transaction_date, reference_number, notes } = req.body;
    const created_by = req.user.id;
    
    if (!boardingHouseId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Boarding house ID is required' 
      });
    }
    
    if (!account_code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Account code is required' 
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
    
    if (!source_account) {
      return res.status(400).json({ 
        success: false, 
        message: 'Source account is required' 
      });
    }

    const balanceAmount = parseFloat(amount);
    
    // Validate account code
    const [accountResult] = await connection.query(
      `SELECT id, code, name, type FROM chart_of_accounts WHERE code = ? AND deleted_at IS NULL`,
      [account_code]
    );

    if (accountResult.length === 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid account code: ${account_code}`
      });
    }

    const account = accountResult[0];

    // Validate that account is an asset account
    if (account.type !== 'Asset') {
      return res.status(400).json({
        success: false,
        message: `Account must be an Asset account. ${account.name} is a ${account.type} account.`
      });
    }
    
    // Validate source account
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
        'banking_balance_addition',
        reference_number || `BBA-${Date.now()}`,
        balanceAmount,
        'USD',
        `Balance Addition: ${description}`,
        transaction_date || new Date().toISOString().split('T')[0],
        boardingHouseId,
        created_by
      ]
    );

    // Create journal entries for proper double-entry bookkeeping
    // 1. Debit the account (money arrives)
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
        account.id,
        balanceAmount,
        `Balance Addition: ${description}`,
        boardingHouseId,
        created_by
      ]
    );

    // 2. Credit the source account (money comes from)
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
        balanceAmount,
        `Balance Addition to ${account.name}`,
        boardingHouseId,
        created_by
      ]
    );

    // Update current account balances
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
        account.id,
        account.code,
        account.name,
        account.type,
        balanceAmount,
        balanceAmount,
        transaction_date || new Date().toISOString().split('T')[0],
        balanceAmount,
        balanceAmount,
        transaction_date || new Date().toISOString().split('T')[0]
      ]
    );
    
    await connection.commit();
    
    res.json({
      success: true,
      message: `Balance added successfully to ${account.name} from ${sourceAccount.name}`,
      transaction_id: mainTransactionResult.insertId,
      account: {
        code: account.code,
        name: account.name,
        type: account.type
      },
      source_account: {
        code: sourceAccount.code,
        name: sourceAccount.name,
        type: sourceAccount.type
      },
      amount: balanceAmount
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error adding balance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add balance'
    });
  } finally {
    connection.release();
  }
};

// Transfer between accounts
exports.transfer = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const boardingHouseId = req.headers['boarding-house-id'] || req.user.boarding_house_id;
    const { from_account, to_account, amount, description, transaction_date, reference_number, notes } = req.body;
    const created_by = req.user.id;
    
    if (!boardingHouseId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Boarding house ID is required' 
      });
    }
    
    if (!from_account || !to_account) {
      return res.status(400).json({ 
        success: false, 
        message: 'Both from and to accounts are required' 
      });
    }
    
    if (from_account === to_account) {
      return res.status(400).json({ 
        success: false, 
        message: 'From and to accounts must be different' 
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

    const transferAmount = parseFloat(amount);
    
    // Validate both accounts
    const [accountsResult] = await connection.query(
      `SELECT id, code, name, type FROM chart_of_accounts WHERE code IN (?, ?) AND deleted_at IS NULL`,
      [from_account, to_account]
    );

    if (accountsResult.length !== 2) {
      return res.status(400).json({
        success: false,
        message: 'One or both accounts not found'
      });
    }

    const fromAccount = accountsResult.find(acc => acc.code === from_account);
    const toAccount = accountsResult.find(acc => acc.code === to_account);

    // Validate that both accounts are asset accounts
    if (fromAccount.type !== 'Asset' || toAccount.type !== 'Asset') {
      return res.status(400).json({
        success: false,
        message: 'Both accounts must be Asset accounts'
      });
    }

    // Check if from account has sufficient balance - get from COA
    const [fromBalanceResult] = await connection.query(
      `SELECT COALESCE(cab.current_balance, 0) as current_balance
       FROM chart_of_accounts coa
       LEFT JOIN current_account_balances cab ON coa.id = cab.account_id
       WHERE coa.code = ? AND coa.deleted_at IS NULL`,
      [from_account]
    );
    
    const fromCurrentBalance = fromBalanceResult.length > 0 ? parseFloat(fromBalanceResult[0].current_balance || 0) : 0;
    
    if (fromCurrentBalance < transferAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance in ${fromAccount.name}. Current balance: $${fromCurrentBalance.toFixed(2)}`
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
        'banking_transfer',
        reference_number || `BT-${Date.now()}`,
        transferAmount,
        'USD',
        `Transfer: ${description}`,
        transaction_date || new Date().toISOString().split('T')[0],
        boardingHouseId,
        created_by
      ]
    );

    // Create journal entries for proper double-entry bookkeeping
    // 1. Debit the to account (money arrives)
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
        toAccount.id,
        transferAmount,
        `Transfer from ${fromAccount.name}: ${description}`,
        boardingHouseId,
        created_by
      ]
    );

    // 2. Credit the from account (money leaves)
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
        fromAccount.id,
        transferAmount,
        `Transfer to ${toAccount.name}: ${description}`,
        boardingHouseId,
        created_by
      ]
    );

    // Update current account balances
    // Update from account balance (decrease)
    await connection.query(
      `INSERT INTO current_account_balances (account_id, account_code, account_name, account_type, current_balance, total_debits, total_credits, transaction_count, last_transaction_date)
       VALUES (?, ?, ?, ?, ?, 0, ?, 1, ?)
       ON DUPLICATE KEY UPDATE 
       current_balance = current_balance - ?,
       total_credits = total_credits + ?,
       transaction_count = transaction_count + 1,
       last_transaction_date = ?,
       updated_at = NOW()`,
      [
        fromAccount.id,
        fromAccount.code,
        fromAccount.name,
        fromAccount.type,
        fromCurrentBalance - transferAmount,
        transferAmount,
        transaction_date || new Date().toISOString().split('T')[0],
        transferAmount,
        transferAmount,
        transaction_date || new Date().toISOString().split('T')[0]
      ]
    );

    // Update to account balance (increase)
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
        toAccount.id,
        toAccount.code,
        toAccount.name,
        toAccount.type,
        transferAmount,
        transferAmount,
        transaction_date || new Date().toISOString().split('T')[0],
        transferAmount,
        transferAmount,
        transaction_date || new Date().toISOString().split('T')[0]
      ]
    );
    
    await connection.commit();
    
    res.json({
      success: true,
      message: `Transfer completed successfully from ${fromAccount.name} to ${toAccount.name}`,
      transaction_id: mainTransactionResult.insertId,
      from_account: {
        code: fromAccount.code,
        name: fromAccount.name,
        type: fromAccount.type
      },
      to_account: {
        code: toAccount.code,
        name: toAccount.name,
        type: toAccount.type
      },
      amount: transferAmount,
      new_from_balance: fromCurrentBalance - transferAmount
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error processing transfer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process transfer'
    });
  } finally {
    connection.release();
  }
};

// Set opening balance for an account
exports.setOpeningBalance = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const boardingHouseId = req.headers['boarding-house-id'] || req.user.boarding_house_id;
    const { account_code, opening_balance, as_of_date, notes } = req.body;
    const created_by = req.user.id;
    
    if (!boardingHouseId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Boarding house ID is required' 
      });
    }
    
    if (!account_code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Account code is required' 
      });
    }
    
    if (!opening_balance || opening_balance <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid opening balance is required' 
      });
    }

    const balanceAmount = parseFloat(opening_balance);
    
    // Validate account code
    const [accountResult] = await connection.query(
      `SELECT id, code, name, type FROM chart_of_accounts WHERE code = ? AND deleted_at IS NULL`,
      [account_code]
    );

    if (accountResult.length === 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid account code: ${account_code}`
      });
    }

    const account = accountResult[0];

    // Validate that account is an asset account
    if (account.type !== 'Asset') {
      return res.status(400).json({
        success: false,
        message: `Account must be an Asset account. ${account.name} is a ${account.type} account.`
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
        'opening_balance_set',
        `OB-${Date.now()}`,
        balanceAmount,
        'USD',
        `Opening Balance Set: ${notes || 'Initial balance'}`,
        as_of_date || new Date().toISOString().split('T')[0],
        boardingHouseId,
        created_by
      ]
    );

    // Create journal entries for proper double-entry bookkeeping
    // 1. Debit the account (money arrives)
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
        account.id,
        balanceAmount,
        `Opening Balance Set: ${notes || 'Initial balance'}`,
        boardingHouseId,
        created_by
      ]
    );

    // 2. Credit a temporary "Opening Balance Equity" account
    const [equityAccountResult] = await connection.query(
      `SELECT id FROM chart_of_accounts WHERE code = '30004' AND deleted_at IS NULL`
    );

    let equityAccountId;
    if (equityAccountResult.length === 0) {
      // Create a temporary equity account if it doesn't exist
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
        balanceAmount,
        `Opening Balance for ${account.name}`,
        boardingHouseId,
        created_by
      ]
    );

    // Update current account balances
    await connection.query(
      `INSERT INTO current_account_balances (account_id, account_code, account_name, account_type, current_balance, total_debits, total_credits, transaction_count, last_transaction_date)
       VALUES (?, ?, ?, ?, ?, ?, 0, 1, ?)
       ON DUPLICATE KEY UPDATE 
       current_balance = ?,
       total_debits = ?,
       transaction_count = transaction_count + 1,
       last_transaction_date = ?,
       updated_at = NOW()`,
      [
        account.id,
        account.code,
        account.name,
        account.type,
        balanceAmount,
        balanceAmount,
        as_of_date || new Date().toISOString().split('T')[0],
        balanceAmount,
        balanceAmount,
        as_of_date || new Date().toISOString().split('T')[0]
      ]
    );
    
    await connection.commit();
    
    res.json({
      success: true,
      message: `Opening balance set successfully for ${account.name}`,
      transaction_id: mainTransactionResult.insertId,
      account: {
        code: account.code,
        name: account.name,
        type: account.type
      },
      opening_balance: balanceAmount,
      as_of_date: as_of_date || new Date().toISOString().split('T')[0]
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error setting opening balance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set opening balance'
    });
  } finally {
    connection.release();
  }
};
