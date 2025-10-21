const db = require('../src/services/db');

async function main() {
  const conn = await db.getConnection();
  try {
    console.log('Checking Cash ledger transactions...');
    
    // Get current Cash balance
    const [[cashBalance]] = await conn.query(
      "SELECT current_balance FROM current_account_balances WHERE account_code = '10002'"
    );
    console.log(`Current Cash balance: $${cashBalance?.current_balance || 0}`);
    
    // Get cash ledger transactions (non-payment transactions)
    const [cashTransactions] = await conn.query(
      `SELECT t.*, je.entry_type, je.amount as je_amount, coa.code, coa.name as account_name
       FROM transactions t
       JOIN journal_entries je ON t.id = je.transaction_id
       JOIN chart_of_accounts coa ON je.account_id = coa.id
       WHERE coa.code = '10002' AND t.deleted_at IS NULL AND je.deleted_at IS NULL 
       AND t.transaction_type IN ('opening_balance', 'expense', 'transfer_to_vault', 'transfer_from_vault')
       ORDER BY t.transaction_date`
    );
    
    console.log(`\nCash ledger transactions: ${cashTransactions.length}`);
    
    let totalDebits = 0;
    let totalCredits = 0;
    
    cashTransactions.forEach(t => {
      const amount = parseFloat(t.je_amount);
      if (t.entry_type === 'debit') {
        totalDebits += amount;
      } else {
        totalCredits += amount;
      }
      console.log(`${t.transaction_date}: ${t.description} - ${t.entry_type} $${t.je_amount} (${t.account_name})`);
    });
    
    console.log(`\nCash Ledger Summary:`);
    console.log(`Total debits: $${totalDebits.toFixed(2)}`);
    console.log(`Total credits: $${totalCredits.toFixed(2)}`);
    console.log(`Net ledger impact: $${(totalDebits - totalCredits).toFixed(2)}`);
    
    // Check if we have the expected transactions
    const hasOpeningBalance = cashTransactions.some(t => t.description.includes('Balance C/F'));
    const hasElectricity = cashTransactions.some(t => t.description.includes('Electricity'));
    const hasCouncilRates = cashTransactions.some(t => t.description.includes('Council rates'));
    const hasManagementFee = cashTransactions.some(t => t.description.includes('Alamait management fee'));
    const hasRentalBalance = cashTransactions.some(t => t.description.includes('Rental Balance paid'));
    const hasVaultTransfers = cashTransactions.some(t => t.description.includes('Vault'));
    
    console.log(`\nExpected transactions check:`);
    console.log(`  Opening balance: ${hasOpeningBalance ? '✅' : '❌'}`);
    console.log(`  Electricity: ${hasElectricity ? '✅' : '❌'}`);
    console.log(`  Council rates: ${hasCouncilRates ? '✅' : '❌'}`);
    console.log(`  Management fee: ${hasManagementFee ? '✅' : '❌'}`);
    console.log(`  Rental balance: ${hasRentalBalance ? '✅' : '❌'}`);
    console.log(`  Vault transfers: ${hasVaultTransfers ? '✅' : '❌'}`);
    
    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    conn.release();
    process.exit(1);
  }
}

main();
