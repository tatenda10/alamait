const db = require('../src/services/db');

async function check() {
  const conn = await db.getConnection();
  try {
    const [accounts] = await conn.query(
      "SELECT id, code, name, type FROM chart_of_accounts WHERE type = 'Equity' AND deleted_at IS NULL ORDER BY code"
    );
    console.log('Equity accounts:');
    accounts.forEach(acc => console.log(`  ${acc.code} - ${acc.name} (ID: ${acc.id})`));
    
    if (accounts.length === 0) {
      console.log('\n⚠️ No equity accounts found. Creating Owner\'s Equity account...');
      
      const [result] = await conn.query(
        `INSERT INTO chart_of_accounts (code, name, type, parent_id, created_at, updated_at)
         VALUES ('30001', 'Owner\\'s Equity', 'Equity', NULL, NOW(), NOW())`
      );
      
      console.log(`✅ Created Owner's Equity account (ID: ${result.insertId})`);
    }
    
    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    conn.release();
    process.exit(1);
  }
}

check();

