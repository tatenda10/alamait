const db = require('../src/services/db');

// Set all non-null admin fees to 20.00, then align September 2025 reset invoices accordingly
async function main() {
  const apply = process.argv.includes('--apply');
  const conn = await db.getConnection();
  try {
    if (apply) await conn.beginTransaction();

    const [toFix] = await conn.query(`
      SELECT COUNT(*) AS cnt FROM student_enrollments WHERE deleted_at IS NULL AND admin_fee IS NOT NULL AND admin_fee <> 20;
    `);
    console.log(`Enrollments with admin_fee <> 20: ${toFix[0]?.cnt || 0}`);

    if (!apply) {
      console.log('Dry run. Re-run with --apply to update admin fees to 20.00');
      return;
    }

    // Update admin_fee to 20
    await conn.query(`
      UPDATE student_enrollments SET admin_fee = 20 WHERE deleted_at IS NULL AND admin_fee IS NOT NULL AND admin_fee <> 20;
    `);

    // Update reset invoice amounts for Sep 2025 to include updated admin fee
    await conn.query(`
      UPDATE transactions t
      JOIN student_enrollments se ON se.student_id = t.student_id AND se.deleted_at IS NULL
      SET t.amount = se.agreed_amount + COALESCE(se.admin_fee,0)
      WHERE t.transaction_type = 'initial_invoice'
        AND DATE_FORMAT(t.transaction_date,'%Y-%m-01')='2025-09-01'
        AND t.deleted_at IS NULL;
    `);

    await conn.query(`
      UPDATE journal_entries je
      JOIN transactions t ON t.id = je.transaction_id
      JOIN student_enrollments se ON se.student_id = t.student_id
      SET je.amount = se.agreed_amount + COALESCE(se.admin_fee,0)
      WHERE t.transaction_type = 'initial_invoice'
        AND DATE_FORMAT(t.transaction_date,'%Y-%m-01')='2025-09-01'
        AND je.deleted_at IS NULL
        AND t.deleted_at IS NULL
        AND se.deleted_at IS NULL;
    `);

    await conn.query(`
      UPDATE student_invoices si
      JOIN student_enrollments se ON si.student_id = se.student_id AND si.enrollment_id = se.id
      SET si.amount = se.agreed_amount + COALESCE(se.admin_fee,0)
      WHERE DATE_FORMAT(si.invoice_date,'%Y-%m-01')='2025-09-01'
        AND si.deleted_at IS NULL;
    `);

    // Update student balances to negative of new amount
    await conn.query(`
      UPDATE student_account_balances sab
      JOIN student_enrollments se ON sab.student_id = se.student_id AND sab.enrollment_id = se.id
      SET sab.current_balance = -(se.agreed_amount + COALESCE(se.admin_fee,0)), sab.updated_at = NOW()
      WHERE se.deleted_at IS NULL;
    `);

    await conn.commit();
    console.log('Admin fee values fixed to 20.00 and related amounts updated.');
  } catch (e) {
    try { await conn.rollback(); } catch(_) {}
    console.error('Fix failed:', e);
    process.exitCode = 1;
  } finally {
    try { conn.release(); } catch(_) {}
    process.exit(0);
  }
}

main();


