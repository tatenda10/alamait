const db = require('../src/services/db');

// Usage:
// node server/scripts/fix_admin_fee_backfill.js           -> dry run (no changes)
// node server/scripts/fix_admin_fee_backfill.js --apply  -> apply changes

async function main() {
  const apply = process.argv.includes('--apply');
  const connection = await db.getConnection();
  try {
    if (apply) {
      await connection.beginTransaction();
    }

    // 1) Count journals tied to initial invoices that include admin fee
    const [rows] = await connection.query(`
      SELECT COUNT(je.id) AS journal_count
      FROM journal_entries je
      JOIN transactions t ON je.transaction_id = t.id AND t.deleted_at IS NULL
      JOIN student_enrollments se ON se.student_id = t.student_id AND se.deleted_at IS NULL
      WHERE t.transaction_type = 'initial_invoice'
        AND DATE_FORMAT(t.transaction_date, '%Y-%m-01') = DATE_FORMAT(se.start_date, '%Y-%m-01')
        AND COALESCE(se.admin_fee, 0) > 0
        AND je.deleted_at IS NULL;
    `);

    console.log(`Journals to adjust (amount will be reduced by admin_fee): ${rows[0]?.journal_count || 0}`);

    // 2) Count admin fee transactions to backdate
    const [adminTx] = await connection.query(`
      SELECT COUNT(*) AS cnt
      FROM transactions t
      WHERE t.transaction_type = 'admin_fee'
        AND t.deleted_at IS NULL
        AND DATE(t.transaction_date) <> DATE_FORMAT(t.transaction_date, '%Y-%m-01');
    `);
    console.log(`Admin fee transactions to backdate (to first day of their month): ${adminTx[0]?.cnt || 0}`);

    if (!apply) {
      console.log('Dry run complete. Re-run with --apply to make changes.');
      return;
    }

    // 3) Backdate admin-fee transactions to first day of start month
    await connection.query(`
      UPDATE transactions t
      SET t.transaction_date = DATE_FORMAT(t.transaction_date, '%Y-%m-01')
      WHERE t.transaction_type = 'admin_fee'
        AND t.deleted_at IS NULL;
    `);

    // 4) Reduce initial-invoice transaction amount by admin fee
    await connection.query(`
      UPDATE transactions t
      JOIN student_enrollments se ON se.student_id = t.student_id
      SET t.amount = t.amount - COALESCE(se.admin_fee, 0)
      WHERE t.transaction_type = 'initial_invoice'
        AND DATE_FORMAT(t.transaction_date, '%Y-%m-01') = DATE_FORMAT(se.start_date, '%Y-%m-01')
        AND COALESCE(se.admin_fee, 0) > 0
        AND t.deleted_at IS NULL
        AND se.deleted_at IS NULL;
    `);

    // 5) Reduce invoice journals by admin fee
    await connection.query(`
      UPDATE journal_entries je
      JOIN transactions t ON je.transaction_id = t.id
      JOIN student_enrollments se ON se.student_id = t.student_id
      SET je.amount = je.amount - COALESCE(se.admin_fee, 0)
      WHERE t.transaction_type = 'initial_invoice'
        AND DATE_FORMAT(t.transaction_date, '%Y-%m-01') = DATE_FORMAT(se.start_date, '%Y-%m-01')
        AND COALESCE(se.admin_fee, 0) > 0
        AND je.deleted_at IS NULL
        AND t.deleted_at IS NULL
        AND se.deleted_at IS NULL;
    `);

    // 6) Adjust student invoices amount and description
    await connection.query(`
      UPDATE student_invoices si
      JOIN student_enrollments se ON si.student_id = se.student_id AND si.enrollment_id = se.id
      SET si.amount = si.amount - COALESCE(se.admin_fee, 0),
          si.description = CONCAT('First month rent for ', DATE_FORMAT(se.start_date, '%M %Y'))
      WHERE DATE_FORMAT(si.invoice_date, '%Y-%m-01') = DATE_FORMAT(se.start_date, '%Y-%m-01')
        AND COALESCE(se.admin_fee, 0) > 0
        AND si.deleted_at IS NULL
        AND se.deleted_at IS NULL;
    `);

    // 7) Fix student account balances (add back admin fee)
    await connection.query(`
      UPDATE student_account_balances sab
      JOIN student_enrollments se ON sab.student_id = se.student_id AND sab.enrollment_id = se.id
      SET sab.current_balance = sab.current_balance + COALESCE(se.admin_fee, 0),
          sab.updated_at = NOW()
      WHERE COALESCE(se.admin_fee, 0) > 0;
    `);

    await connection.commit();
    console.log('Backfill applied successfully.');
  } catch (err) {
    if (connection) {
      try { await connection.rollback(); } catch (_) {}
    }
    console.error('Error running backfill:', err);
    process.exitCode = 1;
  } finally {
    if (connection) connection.release();
    // end pool to exit
    db.end && db.end();
  }
}

main();


