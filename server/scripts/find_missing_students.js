const fs = require('fs');
const path = require('path');
const db = require('../src/services/db');

// Usage:
// node server/scripts/find_missing_students.js <path-to-csv>
// CSV expected columns (header optional): full_name

function loadNames(csvPath) {
  const raw = fs.readFileSync(csvPath, 'utf8');
  return raw
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l && !l.toLowerCase().startsWith('customer')) // skip header like 'CUSTOMER'
    .map(line => {
      // assume columns separated by comma or tab; customer is column 2 if screenshot-exported
      const parts = line.split(/[\t,]/);
      // Try to find a cell that looks like a person name (letters and spaces)
      // If the export has the name in column 1, use that; otherwise fallback to first non-numeric
      let name = parts.find(p => /[A-Za-z]/.test(p)) || '';
      return name.trim();
    })
    .filter(Boolean);
}

(async () => {
  try {
    const csvArg = process.argv[2];
    if (!csvArg) {
      console.error('Please provide a CSV file path: node server/scripts/find_missing_students.js <csv>');
      process.exit(1);
    }
    const csvPath = path.resolve(csvArg);
    if (!fs.existsSync(csvPath)) {
      console.error('File not found:', csvPath);
      process.exit(1);
    }

    const names = Array.from(new Set(loadNames(csvPath)));
    console.log(`Loaded ${names.length} names from CSV`);

    const conn = await db.getConnection();
    const missing = [];

    for (const name of names) {
      const [rows] = await conn.query(
        `SELECT id FROM students WHERE LOWER(TRIM(full_name)) = LOWER(TRIM(?)) AND deleted_at IS NULL LIMIT 1`,
        [name]
      );
      if (rows.length === 0) missing.push(name);
    }

    console.log(`\nNames not found in system (${missing.length}):`);
    missing.forEach(n => console.log(n));
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
})();
