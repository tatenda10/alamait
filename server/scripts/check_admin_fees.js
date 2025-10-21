const db = require('../src/services/db');

async function main() {
  const conn = await db.getConnection();
  try {
    const [distinctFees] = await conn.query(`
      SELECT COALESCE(admin_fee,0) AS admin_fee, COUNT(*) AS cnt
      FROM student_enrollments
      WHERE deleted_at IS NULL
      GROUP BY COALESCE(admin_fee,0)
      ORDER BY admin_fee;
    `);
    console.log('Distinct admin_fee values and counts:');
    distinctFees.forEach(r => console.log(`${Number(r.admin_fee).toFixed(2)} -> ${r.cnt}`));

    const [rows] = await conn.query(`
      SELECT id AS enrollment_id, student_id, agreed_amount, admin_fee
      FROM student_enrollments
      WHERE deleted_at IS NULL AND admin_fee IS NOT NULL AND admin_fee <> 20
      ORDER BY id DESC
      LIMIT 50;
    `);
    console.log('\nSample enrollments with admin_fee <> 20:');
    rows.forEach(r => console.log(`enroll#${r.enrollment_id} student#${r.student_id} rent=${Number(r.agreed_amount).toFixed(2)} admin=${Number(r.admin_fee).toFixed(2)}`));
  } catch (e) {
    console.error('Error:', e);
    process.exitCode = 1;
  } finally {
    try { (await db.getConnection()).release(); } catch (_) {}
    process.exit(0);
  }
}

main();


