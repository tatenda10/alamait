const db = require('../src/services/db');

// Reset all students' initial invoices to 1 Sep 2025, combining rent + admin fee
// Dry run by default; use --apply to perform changes

const RESET_DATE = new Date(2025, 8, 1); // 1 September 2025 (month is 0-based)

async function main() {
  const apply = process.argv.includes('--apply');
  const connection = await db.getConnection();

  try {
    if (apply) await connection.beginTransaction();

    // Get accounts
    const [[recv]] = await connection.query(
      "SELECT id FROM chart_of_accounts WHERE code='10005' AND deleted_at IS NULL LIMIT 1"
    );
    const [[rev]] = await connection.query(
      "SELECT id FROM chart_of_accounts WHERE code='40001' AND deleted_at IS NULL LIMIT 1"
    );
    if (!recv || !rev) throw new Error('Required accounts 10005/40001 not found');

    // Fetch all active enrollments
    const [enrollments] = await connection.query(`
      SELECT se.id AS enrollment_id, se.student_id, se.boarding_house_id, se.agreed_amount, COALESCE(se.admin_fee,0) AS admin_fee
      FROM student_enrollments se
      WHERE se.deleted_at IS NULL
    `);

    // Count journals to delete
    const [delCountRows] = await connection.query(`
      SELECT COUNT(je.id) AS cnt
      FROM journal_entries je
      JOIN transactions t ON t.id = je.transaction_id AND t.deleted_at IS NULL
      WHERE je.deleted_at IS NULL
        AND t.transaction_type IN ('initial_invoice','admin_fee')
        AND je.account_id IN (${recv.id}, ${rev.id});
    `);

    console.log(`Enrollments to process: ${enrollments.length}`);
    console.log(`Existing related journals to soft-delete: ${delCountRows[0]?.cnt || 0}`);

    if (!apply) {
      console.log('Dry run complete. Re-run with --apply to make changes.');
      return;
    }

    // Soft delete existing related transactions and journals
    await connection.query(`
      UPDATE journal_entries je
      JOIN transactions t ON t.id = je.transaction_id
      SET je.deleted_at = NOW()
      WHERE je.deleted_at IS NULL
        AND t.deleted_at IS NULL
        AND t.transaction_type IN ('initial_invoice','admin_fee')
        AND je.account_id IN (${recv.id}, ${rev.id});
    `);

    await connection.query(`
      UPDATE transactions t
      SET t.deleted_at = NOW()
      WHERE t.deleted_at IS NULL
        AND t.transaction_type IN ('initial_invoice','admin_fee');
    `);

    // Process each enrollment: create new invoice txn and journals, update invoice row and student balance
    for (const e of enrollments) {
      const amount = parseFloat(e.agreed_amount) + parseFloat(e.admin_fee || 0);
      const reference = `INV-RESET-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      // Create transaction
      const [txRes] = await connection.query(
        `INSERT INTO transactions (transaction_type, student_id, reference, amount, currency, description, transaction_date, boarding_house_id, created_by, created_at, status)
         VALUES ('initial_invoice', ?, ?, ?, 'USD', 'Reset initial invoice Sep 2025', ?, ?, 1, NOW(), 'posted')`,
        [e.student_id, reference, amount, RESET_DATE, e.boarding_house_id]
      );

      const txId = txRes.insertId;

      // Journals
      await connection.query(
        `INSERT INTO journal_entries (transaction_id, account_id, entry_type, amount, description, boarding_house_id, created_by, created_at)
         VALUES (?, ?, 'debit', ?, 'Reset invoice - Debit Accounts Receivable', ?, 1, NOW())`,
        [txId, recv.id, amount, e.boarding_house_id]
      );

      await connection.query(
        `INSERT INTO journal_entries (transaction_id, account_id, entry_type, amount, description, boarding_house_id, created_by, created_at)
         VALUES (?, ?, 'credit', ?, 'Reset invoice - Credit Rentals Income', ?, 1, NOW())`,
        [txId, rev.id, amount, e.boarding_house_id]
      );

      // Upsert student invoice record for Sep 2025
      const [existingInv] = await connection.query(
        `SELECT id FROM student_invoices WHERE student_id = ? AND enrollment_id = ? AND DATE_FORMAT(invoice_date,'%Y-%m-01') = '2025-09-01' AND deleted_at IS NULL LIMIT 1`,
        [e.student_id, e.enrollment_id]
      );

      if (existingInv.length > 0) {
        await connection.query(
          `UPDATE student_invoices SET amount = ?, description = 'First month invoice reset for September 2025', reference_number = ?, status = 'pending', updated_at = NOW() WHERE id = ?`,
          [amount, reference, existingInv[0].id]
        );
      } else {
        await connection.query(
          `INSERT INTO student_invoices (student_id, enrollment_id, amount, description, invoice_date, reference_number, notes, status, created_at)
           VALUES (?, ?, ?, 'First month invoice reset for September 2025', '2025-09-01', ?, NULL, 'pending', NOW())`,
          [e.student_id, e.enrollment_id, amount, reference]
        );
      }

      // Ensure student_account_balances row exists
      const [bal] = await connection.query(
        `SELECT id FROM student_account_balances WHERE student_id = ? AND enrollment_id = ? LIMIT 1`,
        [e.student_id, e.enrollment_id]
      );
      if (bal.length === 0) {
        await connection.query(
          `INSERT INTO student_account_balances (student_id, enrollment_id, current_balance, created_at, updated_at)
           VALUES (?, ?, ?, NOW(), NOW())`,
          [e.student_id, e.enrollment_id, -amount]
        );
      } else {
        await connection.query(
          `UPDATE student_account_balances SET current_balance = ?, updated_at = NOW() WHERE id = ?`,
          [-amount, bal[0].id]
        );
      }
    }

    await connection.commit();
    console.log('Reset completed successfully.');
  } catch (err) {
    try { await connection.rollback(); } catch (_) {}
    console.error('Reset failed:', err);
    process.exitCode = 1;
  } finally {
    if (connection) connection.release();
    process.exit(0);
  }
}

main();


