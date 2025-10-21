const fs = require('fs');
const path = require('path');
const db = require('../src/services/db');

// Usage:
// node server/scripts/compare_expected_vs_system.js server/scripts/expected_from_image.json
// JSON format: [{ name: string, rent: number, admin_fee: number }]

(async () => {
  try {
    const arg = process.argv[2];
    if (!arg) {
      console.error('Usage: node server/scripts/compare_expected_vs_system.js <expected.json>');
      process.exit(1);
    }
    const jsonPath = path.resolve(arg);
    if (!fs.existsSync(jsonPath)) {
      console.error('File not found:', jsonPath);
      process.exit(1);
    }

    const expected = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    if (!Array.isArray(expected)) {
      console.error('JSON must be an array of { name, rent, admin_fee }');
      process.exit(1);
    }

    const rowsToCheck = expected
      .map(x => ({
        name: String(x.name || '').trim(),
        rent: Number(x.rent || 0),
        admin_fee: Number(x.admin_fee || 0)
      }))
      .filter(x => x.name);

    console.log(`Loaded ${rowsToCheck.length} expected rows`);

    const conn = await db.getConnection();
    const matches = [];
    const mismatches = [];
    const missing = [];

    for (const exp of rowsToCheck) {
      const [rows] = await conn.query(
        `SELECT s.full_name, se.agreed_amount AS rent, COALESCE(se.admin_fee, 0) AS admin_fee
         FROM students s
         JOIN student_enrollments se ON se.student_id = s.id AND se.deleted_at IS NULL
         WHERE s.deleted_at IS NULL AND LOWER(TRIM(s.full_name)) = LOWER(TRIM(?))
         ORDER BY se.id DESC
         LIMIT 1`,
        [exp.name]
      );

      if (rows.length === 0) {
        missing.push({ name: exp.name, expected_rent: exp.rent, expected_admin_fee: exp.admin_fee });
        continue;
      }

      const sys = rows[0];
      const sysRent = Number(sys.rent || 0);
      const sysAdmin = Number(sys.admin_fee || 0);

      if (Math.abs(sysRent - exp.rent) < 0.001 && Math.abs(sysAdmin - exp.admin_fee) < 0.001) {
        matches.push({ name: exp.name, rent: sysRent, admin_fee: sysAdmin });
      } else {
        mismatches.push({
          name: exp.name,
          expected_rent: exp.rent,
          system_rent: sysRent,
          expected_admin_fee: exp.admin_fee,
          system_admin_fee: sysAdmin
        });
      }
    }

    console.log(`\nMatches (${matches.length}):`);
    matches.slice(0, 10).forEach(m => console.log(`${m.name} -> rent ${m.rent.toFixed(2)}, admin ${m.admin_fee.toFixed(2)}`));
    if (matches.length > 10) console.log(`... +${matches.length - 10} more`);

    console.log(`\nMismatches (${mismatches.length}):`);
    mismatches.forEach(m => {
      console.log(`${m.name} -> expected rent ${m.expected_rent.toFixed(2)} vs system ${m.system_rent.toFixed(2)} | expected admin ${m.expected_admin_fee.toFixed(2)} vs system ${m.system_admin_fee.toFixed(2)}`);
    });

    console.log(`\nNot found in system (${missing.length}):`);
    missing.forEach(m => console.log(`${m.name} (expected rent ${m.expected_rent.toFixed(2)}, admin ${m.expected_admin_fee.toFixed(2)})`));

    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
})();
