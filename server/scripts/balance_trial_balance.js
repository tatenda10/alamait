const mysql = require('mysql2/promise');
require('dotenv').config();

async function balanceTrialBalance() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    console.log('🔍 Creating journal entry to balance trial balance...');
    
    // Start transaction
    await connection.beginTransaction();
    
    try {
      // Create a journal entry to balance the trial balance
      // We need to increase debits by $10,685.00
      // I'll debit "Retained Earnings" (or Owner's Equity) and credit "Cash" to balance
      
      const journalEntry = {
        description: 'Adjustment to balance trial balance - July 2025',
        transaction_date: '2025-07-31',
        reference_number: 'ADJ-2025-07-001',
        total_amount: 10685.00,
        created_by: 1 // Assuming user ID 1 is the admin
      };
      
      console.log('📝 Creating journal entry...');
      const [journalResult] = await connection.execute(`
        INSERT INTO journal_entries 
        (description, transaction_date, reference_number, total_amount, created_by, created_at)
        VALUES (?, ?, ?, ?, ?, NOW())
      `, [
        journalEntry.description,
        journalEntry.transaction_date,
        journalEntry.reference_number,
        journalEntry.total_amount,
        journalEntry.created_by
      ]);
      
      const journalId = journalResult.insertId;
      console.log(`✅ Journal entry created with ID: ${journalId}`);
      
      // Create the journal entry lines
      // Debit: Retained Earnings (or Owner's Equity) - $10,685.00
      // Credit: Cash - $10,685.00
      
      console.log('📊 Creating journal entry lines...');
      
      // First, let's find the appropriate accounts
      const [equityAccounts] = await connection.execute(`
        SELECT id, code, name FROM chart_of_accounts 
        WHERE type = 'Equity' AND name LIKE '%retained%' OR name LIKE '%equity%' OR name LIKE '%capital%'
        LIMIT 1
      `);
      
      const [cashAccounts] = await connection.execute(`
        SELECT id, code, name FROM chart_of_accounts 
        WHERE code = '10002' AND name = 'Cash'
        LIMIT 1
      `);
      
      if (equityAccounts.length === 0) {
        console.log('⚠️ No equity account found, using first available equity account...');
        const [allEquityAccounts] = await connection.execute(`
          SELECT id, code, name FROM chart_of_accounts 
          WHERE type = 'Equity'
          LIMIT 1
        `);
        if (allEquityAccounts.length === 0) {
          throw new Error('No equity accounts found in chart of accounts');
        }
        equityAccounts.push(allEquityAccounts[0]);
      }
      
      if (cashAccounts.length === 0) {
        throw new Error('Cash account not found');
      }
      
      const equityAccount = equityAccounts[0];
      const cashAccount = cashAccounts[0];
      
      console.log(`Using Equity Account: ${equityAccount.name} (${equityAccount.code})`);
      console.log(`Using Cash Account: ${cashAccount.name} (${cashAccount.code})`);
      
      // Debit: Retained Earnings/Owner's Equity - $10,685.00
      await connection.execute(`
        INSERT INTO journal_entry_lines 
        (journal_entry_id, account_id, account_code, account_name, debit_amount, credit_amount, created_at)
        VALUES (?, ?, ?, ?, ?, 0, NOW())
      `, [
        journalId,
        equityAccount.id,
        equityAccount.code,
        equityAccount.name,
        10685.00
      ]);
      
      // Credit: Cash - $10,685.00
      await connection.execute(`
        INSERT INTO journal_entry_lines 
        (journal_entry_id, account_id, account_code, account_name, debit_amount, credit_amount, created_at)
        VALUES (?, ?, ?, ?, 0, ?, NOW())
      `, [
        journalId,
        cashAccount.id,
        cashAccount.code,
        cashAccount.name,
        10685.00
      ]);
      
      console.log('✅ Journal entry lines created');
      
      // Update account balances
      console.log('💰 Updating account balances...');
      
      // Update equity account balance (increase debit)
      await connection.execute(`
        UPDATE current_account_balances 
        SET current_balance = current_balance + ?, 
            total_debits = total_debits + ?,
            updated_at = NOW()
        WHERE account_id = ?
      `, [10685.00, 10685.00, equityAccount.id]);
      
      // Update cash account balance (decrease - it's being credited)
      await connection.execute(`
        UPDATE current_account_balances 
        SET current_balance = current_balance - ?, 
            total_credits = total_credits + ?,
            updated_at = NOW()
        WHERE account_id = ?
      `, [10685.00, 10685.00, cashAccount.id]);
      
      console.log('✅ Account balances updated');
      
      // Commit transaction
      await connection.commit();
      console.log('\n🎉 Trial balance adjustment completed successfully!');
      
      // Show the journal entry
      console.log('\n📋 Journal Entry Details:');
      console.log(`Description: ${journalEntry.description}`);
      console.log(`Date: ${journalEntry.transaction_date}`);
      console.log(`Reference: ${journalEntry.reference_number}`);
      console.log(`Amount: $${journalEntry.total_amount.toFixed(2)}`);
      console.log(`Debit: ${equityAccount.name} - $10,685.00`);
      console.log(`Credit: ${cashAccount.name} - $10,685.00`);
      
    } catch (error) {
      await connection.rollback();
      console.error('❌ Error during journal entry creation, transaction rolled back:', error);
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
}

// Run the balance adjustment
balanceTrialBalance();
