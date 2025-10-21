const db = require('../src/services/db');

async function killLocks() {
  const conn = await db.getConnection();
  try {
    // Show processlist
    const [processes] = await conn.query('SHOW PROCESSLIST');
    console.log('Active processes:', processes.length);
    
    // Kill any long-running or sleeping processes (except ourselves)
    for (const proc of processes) {
      if (proc.Time > 30 || (proc.State === 'Sleep' && proc.Time > 10)) {
        console.log(`Killing process ${proc.Id}: ${proc.State} for ${proc.Time}s`);
        try {
          await conn.query(`KILL ${proc.Id}`);
        } catch (e) {
          console.log(`  Could not kill ${proc.Id}:`, e.message);
        }
      }
    }
    
    console.log('Done.');
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  } finally {
    conn.release();
  }
}

killLocks();

