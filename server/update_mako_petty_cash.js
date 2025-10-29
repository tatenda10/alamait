require('dotenv').config();
const mysql = require('mysql2/promise');

async function updateMakoPettyCash() {
  console.log('💰 Updating Mako Petty Cash Balance to $431...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    await connection.beginTransaction();

    const newBalance = 431.00;

    // Find Mako's petty cash account
    const [makoAccount] = await connection.execute(
      `SELECT pca.*, pcu.username, bh.name as boarding_house_name
       FROM petty_cash_accounts pca
       LEFT JOIN petty_cash_users pcu ON pca.petty_cash_user_id = pcu.id
       LEFT JOIN boarding_houses bh ON pca.boarding_house_id = bh.id
       WHERE pcu.username LIKE '%mako%' OR pca.account_name LIKE '%mako%'
       AND pca.deleted_at IS NULL
       LIMIT 1`
    );

    if (makoAccount.length === 0) {
      console.error('❌ Mako petty cash account not found');
      console.log('\nSearching all petty cash accounts...');
      
      const [allAccounts] = await connection.execute(
        `SELECT pca.id, pca.account_name, pcu.username, bh.name as boarding_house_name, pca.current_balance
         FROM petty_cash_accounts pca
         LEFT JOIN petty_cash_users pcu ON pca.petty_cash_user_id = pcu.id
         LEFT JOIN boarding_houses bh ON pca.boarding_house_id = bh.id
         WHERE pca.deleted_at IS NULL`
      );
      
      console.table(allAccounts);
      return;
    }

    const account = makoAccount[0];
    const oldBalance = parseFloat(account.current_balance || 0);

    console.log('📋 Found Mako Petty Cash Account:');
    console.log(`   Account ID: ${account.id}`);
    console.log(`   Account Name: ${account.account_name}`);
    console.log(`   Username: ${account.username || 'N/A'}`);
    console.log(`   Boarding House: ${account.boarding_house_name || 'N/A'}`);
    console.log(`   Current Balance: $${oldBalance.toFixed(2)}`);
    console.log(`   New Balance: $${newBalance.toFixed(2)}`);
    console.log(`   Adjustment: $${(newBalance - oldBalance).toFixed(2)}\n`);

    // Get transaction summary for this account
    const [transactionSummary] = await connection.execute(
      `SELECT 
        COUNT(*) as total_transactions,
        SUM(CASE WHEN transaction_type IN ('cash_inflow', 'student_payment') THEN amount ELSE 0 END) as total_inflows,
        SUM(CASE WHEN transaction_type IN ('cash_outflow', 'withdrawal', 'expense') THEN amount ELSE 0 END) as total_outflows,
        MIN(transaction_date) as first_transaction,
        MAX(transaction_date) as last_transaction
       FROM petty_cash_transactions
       WHERE user_id = ? OR petty_cash_user_id = ?`,
      [account.petty_cash_user_id, account.petty_cash_user_id]
    );

    const summary = transactionSummary[0];
    console.log('📊 Transaction Summary:');
    console.log(`   Total Transactions: ${summary.total_transactions || 0}`);
    console.log(`   Total Inflows: $${parseFloat(summary.total_inflows || 0).toFixed(2)}`);
    console.log(`   Total Outflows: $${parseFloat(summary.total_outflows || 0).toFixed(2)}`);
    console.log(`   Calculated Balance: $${(parseFloat(summary.total_inflows || 0) - parseFloat(summary.total_outflows || 0)).toFixed(2)}`);
    console.log(`   First Transaction: ${summary.first_transaction || 'N/A'}`);
    console.log(`   Last Transaction: ${summary.last_transaction || 'N/A'}\n`);

    // Update the balance
    console.log('💾 Updating petty cash account balance...');
    const [updateResult] = await connection.execute(
      `UPDATE petty_cash_accounts
       SET current_balance = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [newBalance, account.id]
    );

    console.log(`✅ Updated ${updateResult.affectedRows} row(s)\n`);

    // Show recent transactions
    console.log('📋 Recent Transactions (Last 10):');
    const [recentTransactions] = await connection.execute(
      `SELECT 
        transaction_date,
        transaction_type,
        amount,
        description,
        reference_number
       FROM petty_cash_transactions
       WHERE user_id = ? OR petty_cash_user_id = ?
       ORDER BY transaction_date DESC, created_at DESC
       LIMIT 10`,
      [account.petty_cash_user_id, account.petty_cash_user_id]
    );

    if (recentTransactions.length > 0) {
      console.table(recentTransactions.map(t => ({
        'Date': t.transaction_date,
        'Type': t.transaction_type,
        'Amount': `$${parseFloat(t.amount).toFixed(2)}`,
        'Description': (t.description || '').substring(0, 40),
        'Reference': t.reference_number || 'N/A'
      })));
    } else {
      console.log('   No transactions found.');
    }

    await connection.commit();

    // Verify the update
    const [verifyResult] = await connection.execute(
      `SELECT current_balance FROM petty_cash_accounts WHERE id = ?`,
      [account.id]
    );

    console.log('\n═'.repeat(80));
    console.log('\n✅ BALANCE UPDATE COMPLETED!');
    console.log(`   Account: ${account.account_name}`);
    console.log(`   Old Balance: $${oldBalance.toFixed(2)}`);
    console.log(`   New Balance: $${parseFloat(verifyResult[0].current_balance).toFixed(2)}`);
    console.log(`   Change: $${(parseFloat(verifyResult[0].current_balance) - oldBalance).toFixed(2)}\n`);

    console.log('💡 Note: This updates the petty_cash_accounts table.');
    console.log('   If you also need to update the Chart of Accounts (COA) balance,');
    console.log('   run: node update_petty_cash_coa_balance.js\n');

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error updating Mako petty cash balance:', error.message);
    console.error(error);
  } finally {
    await connection.end();
  }
}

updateMakoPettyCash();

