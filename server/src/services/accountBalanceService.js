const db = require('./db');

/**
 * Updates the balance of a specific account in the current_account_balances table
 * @param {number} accountId - The account ID to update
 * @param {number} amount - The amount to add (positive) or subtract (negative)
 * @param {string} entryType - 'debit' or 'credit'
 * @param {number} boardingHouseId - The boarding house ID
 * @param {object} connection - Database connection (optional, will create new if not provided)
 */
const updateAccountBalance = async (accountId, amount, entryType, boardingHouseId, connection = null) => {
  const shouldReleaseConnection = !connection;
  if (!connection) {
    connection = await db.getConnection();
  }

  try {
    console.log(`updateAccountBalance called: accountId=${accountId}, amount=${amount}, entryType=${entryType}, boardingHouseId=${boardingHouseId}`);
    
    // Get account details from chart_of_accounts
    const [accountDetails] = await connection.query(
      'SELECT id, code, name, type FROM chart_of_accounts WHERE id = ? AND deleted_at IS NULL',
      [accountId]
    );

    if (accountDetails.length === 0) {
      throw new Error(`Account with ID ${accountId} not found`);
    }

    const account = accountDetails[0];
    console.log(`Found account: ${account.code} - ${account.name} (${account.type})`);

    // Check if balance record exists in current_account_balances
    const [existingBalance] = await connection.query(
      'SELECT current_balance, total_debits, total_credits FROM current_account_balances WHERE account_id = ?',
      [accountId]
    );

    let currentBalance = 0;
    let totalDebits = 0;
    let totalCredits = 0;

    if (existingBalance.length > 0) {
      currentBalance = parseFloat(existingBalance[0].current_balance || 0);
      totalDebits = parseFloat(existingBalance[0].total_debits || 0);
      totalCredits = parseFloat(existingBalance[0].total_credits || 0);
      console.log(`Existing balance: ${currentBalance}, debits: ${totalDebits}, credits: ${totalCredits}`);
    } else {
      console.log('No existing balance record found, starting with 0');
    }

    // Update balance based on entry type and account type
    const amountValue = parseFloat(amount);
    
    // For liability, equity, and revenue accounts, credits increase and debits decrease
    if (account.type === 'Liability' || account.type === 'Equity' || account.type === 'Revenue') {
      if (entryType === 'debit') {
        currentBalance -= amountValue; // Debit reduces liability/equity/revenue
        totalDebits += amountValue;
      } else if (entryType === 'credit') {
        currentBalance += amountValue; // Credit increases liability/equity/revenue
        totalCredits += amountValue;
      } else {
        throw new Error(`Invalid entry type: ${entryType}`);
      }
    } else {
      // For asset and expense accounts (debits increase, credits decrease)
      if (entryType === 'debit') {
        currentBalance += amountValue; // Debit increases asset/expense
        totalDebits += amountValue;
      } else if (entryType === 'credit') {
        currentBalance -= amountValue; // Credit reduces asset/expense
        totalCredits += amountValue;
      } else {
        throw new Error(`Invalid entry type: ${entryType}`);
      }
    }

    console.log(`New balance: ${currentBalance}, new debits: ${totalDebits}, new credits: ${totalCredits}`);

    // Update or insert the balance record
    if (existingBalance.length > 0) {
      console.log('Updating existing balance record');
      await connection.query(
        `UPDATE current_account_balances 
         SET current_balance = ?, 
             total_debits = ?,
             total_credits = ?,
             transaction_count = transaction_count + 1,
             last_transaction_date = CURDATE(),
             updated_at = NOW()
         WHERE account_id = ?`,
        [currentBalance, totalDebits, totalCredits, accountId]
      );
    } else {
      console.log('Creating new balance record');
      await connection.query(
        `INSERT INTO current_account_balances (
          account_id, account_code, account_name, account_type,
          current_balance, total_debits, total_credits, transaction_count,
          last_transaction_date, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, CURDATE(), NOW(), NOW())`,
        [accountId, account.code, account.name, account.type, currentBalance, totalDebits, totalCredits]
      );
    }

    console.log(`Updated account ${accountId} (${account.code}) balance: ${currentBalance} (${entryType} ${amount})`);
    
    return currentBalance;
  } catch (error) {
    console.error('Error updating account balance:', error);
    throw error;
  } finally {
    if (shouldReleaseConnection) {
      connection.release();
    }
  }
};

/**
 * Updates multiple account balances for a transaction
 * @param {Array} journalEntries - Array of journal entry objects with accountId, amount, entryType
 * @param {number} boardingHouseId - The boarding house ID
 * @param {object} connection - Database connection (optional)
 */
const updateMultipleAccountBalances = async (journalEntries, boardingHouseId, connection = null) => {
  const shouldReleaseConnection = !connection;
  if (!connection) {
    connection = await db.getConnection();
  }

  try {
    for (const entry of journalEntries) {
      await updateAccountBalance(
        entry.accountId, 
        entry.amount, 
        entry.entryType, 
        boardingHouseId, 
        connection
      );
    }
  } catch (error) {
    console.error('Error updating multiple account balances:', error);
    throw error;
  } finally {
    if (shouldReleaseConnection) {
      connection.release();
    }
  }
};

/**
 * Recalculates and updates all account balances based on journal entries
 * This is useful for fixing any discrepancies
 * @param {number} boardingHouseId - The boarding house ID (optional)
 * @param {object} connection - Database connection (optional)
 */
const recalculateAllAccountBalances = async (boardingHouseId = null, connection = null) => {
  const shouldReleaseConnection = !connection;
  if (!connection) {
    connection = await db.getConnection();
  }

  try {
    // Clear all existing balances
    await connection.query('DELETE FROM current_account_balances');

    // Recalculate balances from journal entries
    let balanceQuery = `
      INSERT INTO current_account_balances (
        account_id, account_code, account_name, account_type,
        current_balance, total_debits, total_credits, transaction_count,
        last_transaction_date, created_at, updated_at
      )
      SELECT 
        coa.id as account_id,
        coa.code as account_code,
        coa.name as account_name,
        coa.type as account_type,
        COALESCE(SUM(
          CASE 
            WHEN coa.type IN ('Liability', 'Equity', 'Revenue') THEN
              CASE 
                WHEN je.entry_type = 'debit' THEN -je.amount
                WHEN je.entry_type = 'credit' THEN je.amount
                ELSE 0
              END
            ELSE
              CASE 
                WHEN je.entry_type = 'debit' THEN je.amount
                WHEN je.entry_type = 'credit' THEN -je.amount
                ELSE 0
              END
          END
        ), 0) as current_balance,
        COALESCE(SUM(CASE WHEN je.entry_type = 'debit' THEN je.amount ELSE 0 END), 0) as total_debits,
        COALESCE(SUM(CASE WHEN je.entry_type = 'credit' THEN je.amount ELSE 0 END), 0) as total_credits,
        COUNT(je.id) as transaction_count,
        CURDATE() as last_transaction_date,
        NOW() as created_at,
        NOW() as updated_at
      FROM chart_of_accounts coa
      LEFT JOIN journal_entries je ON coa.id = je.account_id AND je.deleted_at IS NULL
      WHERE coa.deleted_at IS NULL
    `;
    
    let params = [];
    if (boardingHouseId) {
      balanceQuery += ' AND (je.boarding_house_id = ? OR je.boarding_house_id IS NULL)';
      params = [boardingHouseId];
    }
    
    balanceQuery += ' GROUP BY coa.id, coa.code, coa.name, coa.type';
    
    await connection.query(balanceQuery, params);
    
    console.log('Recalculated all account balances');
  } catch (error) {
    console.error('Error recalculating account balances:', error);
    throw error;
  } finally {
    if (shouldReleaseConnection) {
      connection.release();
    }
  }
};

module.exports = {
  updateAccountBalance,
  updateMultipleAccountBalances,
  recalculateAllAccountBalances
};
