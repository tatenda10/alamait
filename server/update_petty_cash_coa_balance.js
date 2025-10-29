require('dotenv').config();
const mysql = require('mysql2/promise');

async function updatePettyCashCOABalance() {
  console.log('🔄 Updating Petty Cash COA Balance Based on Journal Entries...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    await connection.beginTransaction();

    // Get Petty Cash account from Chart of Accounts
    const [pettyCashAccount] = await connection.execute(
      `SELECT id, code, name, type FROM chart_of_accounts WHERE code = '10001' AND deleted_at IS NULL`
    );

    if (pettyCashAccount.length === 0) {
      console.error('❌ Petty Cash account (10001) not found in Chart of Accounts');
      return;
    }

    const accountId = pettyCashAccount[0].id;
    const accountCode = pettyCashAccount[0].code;
    const accountName = pettyCashAccount[0].name;
    const accountType = pettyCashAccount[0].type;

    console.log('📋 Petty Cash Account Details:');
    console.log(`   ID: ${accountId}`);
    console.log(`   Code: ${accountCode}`);
    console.log(`   Name: ${accountName}`);
    console.log(`   Type: ${accountType}\n`);

    // Calculate total debits and credits from journal entries
    const [journalSummary] = await connection.execute(
      `SELECT 
        SUM(CASE WHEN entry_type = 'debit' THEN amount ELSE 0 END) as total_debits,
        SUM(CASE WHEN entry_type = 'credit' THEN amount ELSE 0 END) as total_credits,
        COUNT(*) as total_entries,
        MIN(created_at) as first_entry_date,
        MAX(created_at) as last_entry_date
       FROM journal_entries
       WHERE account_id = ? AND deleted_at IS NULL`,
      [accountId]
    );

    const totalDebits = parseFloat(journalSummary[0].total_debits || 0);
    const totalCredits = parseFloat(journalSummary[0].total_credits || 0);
    const totalEntries = parseInt(journalSummary[0].total_entries || 0);
    const firstEntryDate = journalSummary[0].first_entry_date;
    const lastEntryDate = journalSummary[0].last_entry_date;

    // For an Asset account (Petty Cash), balance = Debits - Credits
    const calculatedBalance = totalDebits - totalCredits;

    console.log('📊 Journal Entries Summary:');
    console.log(`   Total Debits:  $${totalDebits.toFixed(2)}`);
    console.log(`   Total Credits: $${totalCredits.toFixed(2)}`);
    console.log(`   Calculated Balance (Debits - Credits): $${calculatedBalance.toFixed(2)}`);
    console.log(`   Total Entries: ${totalEntries}`);
    console.log(`   First Entry: ${firstEntryDate || 'N/A'}`);
    console.log(`   Last Entry:  ${lastEntryDate || 'N/A'}\n`);

    // Get current balance from current_account_balances
    const [currentBalanceResult] = await connection.execute(
      `SELECT current_balance, total_debits, total_credits, transaction_count, last_transaction_date
       FROM current_account_balances
       WHERE account_id = ?`,
      [accountId]
    );

    if (currentBalanceResult.length > 0) {
      const currentBalance = parseFloat(currentBalanceResult[0].current_balance || 0);
      const currentDebits = parseFloat(currentBalanceResult[0].total_debits || 0);
      const currentCredits = parseFloat(currentBalanceResult[0].total_credits || 0);
      const currentCount = parseInt(currentBalanceResult[0].transaction_count || 0);
      
      console.log('💾 Current Balance Record:');
      console.log(`   Current Balance: $${currentBalance.toFixed(2)}`);
      console.log(`   Current Debits:  $${currentDebits.toFixed(2)}`);
      console.log(`   Current Credits: $${currentCredits.toFixed(2)}`);
      console.log(`   Transaction Count: ${currentCount}\n`);

      const difference = calculatedBalance - currentBalance;
      console.log('🔍 Difference Analysis:');
      console.log(`   Difference: $${difference.toFixed(2)}`);
      
      if (Math.abs(difference) > 0.01) {
        console.log('   ⚠️  Balance mismatch detected!\n');
      } else {
        console.log('   ✅ Balance is correct!\n');
      }
    } else {
      console.log('ℹ️  No existing balance record found. Will create new one.\n');
    }

    // Update or insert the balance
    console.log('💾 Updating Petty Cash COA balance...');
    await connection.execute(
      `INSERT INTO current_account_balances (
        account_id,
        account_code,
        account_name,
        account_type,
        current_balance,
        total_debits,
        total_credits,
        transaction_count,
        last_transaction_date,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        current_balance = VALUES(current_balance),
        total_debits = VALUES(total_debits),
        total_credits = VALUES(total_credits),
        transaction_count = VALUES(transaction_count),
        last_transaction_date = VALUES(last_transaction_date),
        updated_at = NOW()`,
      [
        accountId,
        accountCode,
        accountName,
        accountType,
        calculatedBalance,
        totalDebits,
        totalCredits,
        totalEntries,
        lastEntryDate
      ]
    );

    await connection.commit();

    console.log('✅ Petty Cash COA balance updated successfully!\n');

    // Display updated balance
    const [updatedBalance] = await connection.execute(
      `SELECT current_balance, total_debits, total_credits, transaction_count, last_transaction_date
       FROM current_account_balances
       WHERE account_id = ?`,
      [accountId]
    );

    console.log('═'.repeat(80));
    console.log('\n📊 UPDATED PETTY CASH BALANCE:');
    console.table([{
      'Current Balance': `$${parseFloat(updatedBalance[0].current_balance).toFixed(2)}`,
      'Total Debits': `$${parseFloat(updatedBalance[0].total_debits).toFixed(2)}`,
      'Total Credits': `$${parseFloat(updatedBalance[0].total_credits).toFixed(2)}`,
      'Transactions': updatedBalance[0].transaction_count,
      'Last Updated': updatedBalance[0].last_transaction_date
    }]);

    // Show breakdown of recent transactions
    console.log('\n📋 Recent Petty Cash Transactions (Last 10):');
    const [recentTransactions] = await connection.execute(
      `SELECT 
        t.transaction_date,
        t.transaction_type,
        t.description,
        t.reference,
        je.entry_type,
        je.amount,
        CASE 
          WHEN je.entry_type = 'debit' THEN je.amount
          ELSE -je.amount
        END as impact
       FROM journal_entries je
       JOIN transactions t ON je.transaction_id = t.id
       WHERE je.account_id = ? AND je.deleted_at IS NULL AND t.deleted_at IS NULL
       ORDER BY t.transaction_date DESC, je.created_at DESC
       LIMIT 10`,
      [accountId]
    );

    if (recentTransactions.length > 0) {
      console.table(recentTransactions.map(t => ({
        'Date': t.transaction_date,
        'Type': t.transaction_type,
        'Description': t.description.substring(0, 40),
        'Entry Type': t.entry_type,
        'Amount': `$${parseFloat(t.amount).toFixed(2)}`,
        'Impact': `$${parseFloat(t.impact).toFixed(2)}`
      })));
    } else {
      console.log('   No transactions found.');
    }

    console.log('\n✨ Script completed successfully!\n');

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error updating Petty Cash COA balance:', error.message);
    console.error(error);
  } finally {
    await connection.end();
  }
}

updatePettyCashCOABalance();

