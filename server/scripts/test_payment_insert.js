const db = require('../src/services/db');

async function test() {
  const conn = await db.getConnection();
  try {
    console.log('Testing student count...');
    const [students] = await conn.query('SELECT COUNT(*) as cnt FROM students WHERE deleted_at IS NULL');
    console.log(`Active students: ${students[0].cnt}`);
    
    console.log('Testing first student...');
    const [first] = await conn.query('SELECT id, full_name FROM students WHERE deleted_at IS NULL LIMIT 1');
    if (first.length > 0) {
      console.log(`First student: ${first[0].full_name} (ID: ${first[0].id})`);
    }
    
    console.log('Testing account lookup...');
    const [cash] = await conn.query(`SELECT id FROM chart_of_accounts WHERE code='10002' AND deleted_at IS NULL`);
    const [recv] = await conn.query(`SELECT id FROM chart_of_accounts WHERE code='10005' AND deleted_at IS NULL`);
    console.log(`Cash account ID: ${cash[0]?.id}, Receivable account ID: ${recv[0]?.id}`);
    
    console.log('All tests passed!');
    process.exit(0);
  } catch (e) {
    console.error('Test failed:', e);
    process.exit(1);
  } finally {
    conn.release();
  }
}

test();

