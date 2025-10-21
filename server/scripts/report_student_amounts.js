const fs = require('fs');
const path = require('path');
const db = require('../src/services/db');

// Usage:
// node server/scripts/report_student_amounts.js <path-to-csv-with-names>
// CSV: one name per line or with headers; script picks the first text column as the name

function loadNames(csvPath) {
  const raw = fs.readFileSync(csvPath, 'utf8');
  return raw
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l)
    .map(line => {
      const parts = line.split(/[\t,]/);
      const name = parts.find(p => /[A-Za-z]/.test(p)) || '';
      return name.trim();
    })
    .filter(Boolean);
}

(async () => {
  try {
    const csvArg = process.argv[2];
    if (!csvArg) {
      console.error('Usage: node server/scripts/report_student_amounts.js <csv-with-names>');
      process.exit(1);
    }
    const csvPath = path.resolve(csvArg);
    if (!fs.existsSync(csvPath)) {
      console.error('File not found:', csvPath);
      process.exit(1);
    }

    const names = Array.from(new Set(loadNames(csvPath)));
    console.log(`Loaded ${names.length} names`);

    const conn = await db.getConnection();
    const results = [];
    const missing = [];

    for (const name of names) {
      const [rows] = await conn.query(
        `SELECT s.full_name, se.agreed_amount AS rent, COALESCE(se.admin_fee, 0) AS admin_fee
         FROM students s
         JOIN student_enrollments se ON se.student_id = s.id AND se.deleted_at IS NULL
         WHERE s.deleted_at IS NULL AND LOWER(TRIM(s.full_name)) = LOWER(TRIM(?))
         ORDER BY se.id DESC
         LIMIT 1`,
        [name]
      );

      if (rows.length === 0) {
        missing.push(name);
      } else {
        const r = rows[0];
        results.push({
          name: r.full_name,
          rent: Number(r.rent || 0),
          admin_fee: Number(r.admin_fee || 0),
          total: Number(r.rent || 0) + Number(r.admin_fee || 0),
        });
      }
    }

    console.log('\nName,Rent,AdminFee,Total');
    for (const r of results) {
      console.log(`${r.name},${r.rent.toFixed(2)},${r.admin_fee.toFixed(2)},${r.total.toFixed(2)}`);
    }

    if (missing.length) {
      console.log(`\nNot found in system (${missing.length}):`);
      missing.forEach(n => console.log(n));
    }

    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
})();
