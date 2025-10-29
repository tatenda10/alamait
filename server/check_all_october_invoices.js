require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkAllOctoberInvoices() {
  console.log('🔍 Checking ALL October 2025 Invoices...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    // Check for all monthly invoices in October
    console.log('📋 ALL OCTOBER MONTHLY INVOICES:');
    const [octoberInvoices] = await connection.execute(`
      SELECT 
        t.id,
        t.transaction_type,
        t.reference,
        t.amount,
        t.description,
        t.transaction_date,
        s.full_name as student_name,
        t.created_at
      FROM transactions t
      LEFT JOIN students s ON t.student_id = s.id
      WHERE t.transaction_date >= '2025-10-01'
        AND t.transaction_date <= '2025-10-31'
        AND t.transaction_type = 'monthly_invoice'
      ORDER BY t.transaction_date, s.full_name
    `);
    
    if (octoberInvoices.length > 0) {
      console.table(octoberInvoices);
      
      const totalInvoiced = octoberInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
      console.log(`\n💰 TOTAL OCTOBER INVOICES: $${totalInvoiced.toFixed(2)}`);
      console.log(`📊 NUMBER OF INVOICES: ${octoberInvoices.length}`);
    } else {
      console.log('⚠️  NO monthly_invoice transactions found for October 2025');
    }

    // Check for all initial invoices in October (might be students enrolled in October)
    console.log('\n\n📋 OCTOBER INITIAL INVOICES (New Students):');
    const [initialInvoices] = await connection.execute(`
      SELECT 
        t.id,
        t.transaction_type,
        t.reference,
        t.amount,
        t.description,
        t.transaction_date,
        s.full_name as student_name,
        t.created_at
      FROM transactions t
      LEFT JOIN students s ON t.student_id = s.id
      WHERE t.transaction_date >= '2025-10-01'
        AND t.transaction_date <= '2025-10-31'
        AND t.transaction_type = 'initial_invoice'
      ORDER BY t.transaction_date, s.full_name
    `);
    
    if (initialInvoices.length > 0) {
      console.table(initialInvoices);
      
      const totalInitial = initialInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
      console.log(`\n💰 TOTAL INITIAL INVOICES: $${totalInitial.toFixed(2)}`);
      console.log(`📊 NUMBER OF INITIAL INVOICES: ${initialInvoices.length}`);
    } else {
      console.log('⚠️  NO initial_invoice transactions found for October 2025');
    }

    // Check for admin fees in October
    console.log('\n\n📋 OCTOBER ADMIN FEES:');
    const [adminFees] = await connection.execute(`
      SELECT 
        t.id,
        t.transaction_type,
        t.reference,
        t.amount,
        t.description,
        t.transaction_date,
        s.full_name as student_name,
        t.created_at
      FROM transactions t
      LEFT JOIN students s ON t.student_id = s.id
      WHERE t.transaction_date >= '2025-10-01'
        AND t.transaction_date <= '2025-10-31'
        AND t.transaction_type = 'admin_fee'
      ORDER BY t.transaction_date, s.full_name
    `);
    
    if (adminFees.length > 0) {
      console.table(adminFees);
      
      const totalAdminFees = adminFees.reduce((sum, fee) => sum + parseFloat(fee.amount), 0);
      console.log(`\n💰 TOTAL ADMIN FEES: $${totalAdminFees.toFixed(2)}`);
      console.log(`📊 NUMBER OF ADMIN FEES: ${adminFees.length}`);
    } else {
      console.log('⚠️  NO admin_fee transactions found for October 2025');
    }

    // Grand total summary
    console.log('\n\n' + '='.repeat(80));
    console.log('📊 OCTOBER 2025 INVOICE SUMMARY:');
    console.log('='.repeat(80));
    
    const monthlyTotal = octoberInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0);
    const initialTotal = initialInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0);
    const adminTotal = adminFees.reduce((sum, fee) => sum + parseFloat(fee.amount || 0), 0);
    const grandTotal = monthlyTotal + initialTotal + adminTotal;
    
    console.log(`Monthly Invoices:  $${monthlyTotal.toFixed(2)} (${octoberInvoices.length} invoices)`);
    console.log(`Initial Invoices:  $${initialTotal.toFixed(2)} (${initialInvoices.length} invoices)`);
    console.log(`Admin Fees:        $${adminTotal.toFixed(2)} (${adminFees.length} fees)`);
    console.log('-'.repeat(80));
    console.log(`GRAND TOTAL:       $${grandTotal.toFixed(2)}`);

    // Compare with revenue
    console.log('\n\n💵 OCTOBER REVENUE (from journal entries):');
    const [revenueCheck] = await connection.execute(`
      SELECT 
        SUM(CASE WHEN je.entry_type = 'credit' THEN je.amount ELSE 0 END) as total_revenue
      FROM journal_entries je
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      JOIN transactions t ON je.transaction_id = t.id
      WHERE coa.code = '40001'
        AND t.transaction_date >= '2025-10-01'
        AND t.transaction_date <= '2025-10-31'
    `);
    console.log(`Total Revenue: $${parseFloat(revenueCheck[0].total_revenue).toFixed(2)}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await connection.end();
  }
}

checkAllOctoberInvoices();
