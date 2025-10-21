const db = require('../src/services/db');

async function main() {
  const connection = await db.getConnection();
  try {
    // Summaries for Receivables and Revenue
    const [summary] = await connection.query(`
      SELECT coa.code, coa.name,
             COALESCE(SUM(CASE WHEN je.entry_type = 'debit' THEN je.amount ELSE 0 END), 0) AS total_debits,
             COALESCE(SUM(CASE WHEN je.entry_type = 'credit' THEN je.amount ELSE 0 END), 0) AS total_credits,
             COALESCE(SUM(CASE WHEN je.entry_type = 'debit' THEN je.amount WHEN je.entry_type = 'credit' THEN -je.amount END), 0) AS net_balance,
             COUNT(je.id) AS journal_count
      FROM chart_of_accounts coa
      LEFT JOIN journal_entries je ON je.account_id = coa.id AND je.deleted_at IS NULL
      WHERE coa.code IN ('10005','40001') AND coa.deleted_at IS NULL
      GROUP BY coa.code, coa.name
      ORDER BY coa.code;
    `);

    console.log('Account summaries (10005 Receivable, 40001 Revenue):');
    summary.forEach(r => {
      console.log(`${r.code} ${r.name} -> debits: ${Number(r.total_debits).toFixed(2)}, credits: ${Number(r.total_credits).toFixed(2)}, net: ${Number(r.net_balance).toFixed(2)}, journals: ${r.journal_count}`);
    });

    // Show latest journals for those accounts
    const [latest] = await connection.query(`
      SELECT je.id, je.entry_type, je.amount, t.transaction_type, t.transaction_date, je.description
      FROM journal_entries je
      JOIN transactions t ON t.id = je.transaction_id
      WHERE je.account_id IN (SELECT id FROM chart_of_accounts WHERE code IN ('10005','40001') AND deleted_at IS NULL)
        AND je.deleted_at IS NULL
      ORDER BY je.id DESC
      LIMIT 10;
    `);

    console.log('\nLatest 10 journal rows for 10005/40001:');
    latest.forEach(j => {
      console.log(`#${j.id} ${j.transaction_type} ${j.transaction_date} ${j.entry_type} ${Number(j.amount).toFixed(2)} - ${j.description}`);
    });

    // Check reset invoice amounts by enrollment (sample 10) to confirm rent+admin totals
    const [samples] = await connection.query(`
      SELECT se.id AS enrollment_id, se.student_id, se.agreed_amount, COALESCE(se.admin_fee,0) AS admin_fee,
             (se.agreed_amount + COALESCE(se.admin_fee,0)) AS expected_total,
             t.amount AS posted_amount
      FROM student_enrollments se
      LEFT JOIN transactions t ON t.student_id = se.student_id AND t.transaction_type = 'initial_invoice' AND DATE_FORMAT(t.transaction_date,'%Y-%m-01')='2025-09-01' AND t.deleted_at IS NULL
      WHERE se.deleted_at IS NULL
      ORDER BY se.id DESC
      LIMIT 10;
    `);

    console.log('\nSample reset invoices (expected vs posted):');
    samples.forEach(s => {
      console.log(`enroll#${s.enrollment_id} student#${s.student_id} expected=${Number(s.expected_total).toFixed(2)} posted=${Number(s.posted_amount || 0).toFixed(2)} (rent=${Number(s.agreed_amount).toFixed(2)} admin=${Number(s.admin_fee).toFixed(2)})`);
    });

  } catch (err) {
    console.error('Verification error:', err);
    process.exitCode = 1;
  } finally {
    try { (await db.getConnection()).release(); } catch (_) {}
    process.exit(0);
  }
}

main();


