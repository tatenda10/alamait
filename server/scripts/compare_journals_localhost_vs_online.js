require('dotenv').config();
const mysql = require('mysql2/promise');

// Database configurations
const localhostConfig = process.env.LOCAL_DB_HOST ? {
  host: process.env.LOCAL_DB_HOST || 'localhost',
  user: process.env.LOCAL_DB_USER || 'root',
  password: process.env.LOCAL_DB_PASSWORD || '',
  database: process.env.LOCAL_DB_NAME || 'alamait',
  dateStrings: true
} : null;

const onlineConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'alamait',
  dateStrings: true
};

async function compareJournals() {
  let localhostConn, onlineConn;

  try {
    console.log('='.repeat(80));
    console.log('COMPARING JOURNAL ENTRIES: Localhost vs Online');
    console.log('='.repeat(80));
    console.log('');

    if (!localhostConfig) {
      throw new Error('Localhost config not set! Please set LOCAL_DB_HOST, LOCAL_DB_USER, LOCAL_DB_PASSWORD, LOCAL_DB_NAME in .env');
    }

    // Connect to databases
    console.log('📊 Connecting to LOCALHOST...');
    localhostConn = await mysql.createConnection(localhostConfig);
    await localhostConn.query("SET time_zone = '+00:00'");
    console.log('✅ Connected to localhost\n');

    console.log('🌐 Connecting to ONLINE SERVER...');
    onlineConn = await mysql.createConnection(onlineConfig);
    await onlineConn.query("SET time_zone = '+00:00'");
    console.log('✅ Connected to online server\n');

    // 1. Total journal entries count
    console.log('1️⃣  Total Journal Entries Count...');
    const [localhostTotal] = await localhostConn.query(`
      SELECT COUNT(*) as total
      FROM journal_entries
      WHERE deleted_at IS NULL
    `);

    const [onlineTotal] = await onlineConn.query(`
      SELECT COUNT(*) as total
      FROM journal_entries
      WHERE deleted_at IS NULL
    `);

    console.log(`   Localhost: ${localhostTotal[0].total} entries`);
    console.log(`   Online: ${onlineTotal[0].total} entries`);
    console.log(`   Difference: ${localhostTotal[0].total - onlineTotal[0].total} entries`);
    console.log('');

    // 2. Journal entries by entry type
    console.log('2️⃣  Journal Entries by Entry Type...');
    const [localhostByType] = await localhostConn.query(`
      SELECT 
        entry_type,
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as total_amount
      FROM journal_entries
      WHERE deleted_at IS NULL
      GROUP BY entry_type
      ORDER BY entry_type
    `);

    const [onlineByType] = await onlineConn.query(`
      SELECT 
        entry_type,
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as total_amount
      FROM journal_entries
      WHERE deleted_at IS NULL
      GROUP BY entry_type
      ORDER BY entry_type
    `);

    console.log('   LOCALHOST:');
    localhostByType.forEach(row => {
      console.log(`     ${row.entry_type}: ${row.count} entries, $${parseFloat(row.total_amount).toFixed(2)}`);
    });
    console.log('');
    console.log('   ONLINE:');
    onlineByType.forEach(row => {
      console.log(`     ${row.entry_type}: ${row.count} entries, $${parseFloat(row.total_amount).toFixed(2)}`);
    });
    console.log('');

    // 3. Journal entries by account type
    console.log('3️⃣  Journal Entries by Account Type...');
    const [localhostByAccountType] = await localhostConn.query(`
      SELECT 
        coa.type as account_type,
        je.entry_type,
        COUNT(*) as count,
        COALESCE(SUM(je.amount), 0) as total_amount
      FROM journal_entries je
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      WHERE je.deleted_at IS NULL
        AND coa.deleted_at IS NULL
      GROUP BY coa.type, je.entry_type
      ORDER BY coa.type, je.entry_type
    `);

    const [onlineByAccountType] = await onlineConn.query(`
      SELECT 
        coa.type as account_type,
        je.entry_type,
        COUNT(*) as count,
        COALESCE(SUM(je.amount), 0) as total_amount
      FROM journal_entries je
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      WHERE je.deleted_at IS NULL
        AND coa.deleted_at IS NULL
      GROUP BY coa.type, je.entry_type
      ORDER BY coa.type, je.entry_type
    `);

    console.log('   LOCALHOST:');
    localhostByAccountType.forEach(row => {
      console.log(`     ${row.account_type} (${row.entry_type}): ${row.count} entries, $${parseFloat(row.total_amount).toFixed(2)}`);
    });
    console.log('');
    console.log('   ONLINE:');
    onlineByAccountType.forEach(row => {
      console.log(`     ${row.account_type} (${row.entry_type}): ${row.count} entries, $${parseFloat(row.total_amount).toFixed(2)}`);
    });
    console.log('');

    // 4. Journal entries by transaction date range (October 2025)
    const startDate = '2025-10-01';
    const endDate = '2025-10-31';
    console.log(`4️⃣  Journal Entries in Date Range (${startDate} to ${endDate})...`);
    
    const [localhostByDate] = await localhostConn.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(DISTINCT je.transaction_id) as unique_transactions,
        COUNT(CASE WHEN je.entry_type = 'debit' THEN 1 END) as debit_count,
        COUNT(CASE WHEN je.entry_type = 'credit' THEN 1 END) as credit_count,
        COALESCE(SUM(CASE WHEN je.entry_type = 'debit' THEN je.amount ELSE 0 END), 0) as total_debits,
        COALESCE(SUM(CASE WHEN je.entry_type = 'credit' THEN je.amount ELSE 0 END), 0) as total_credits
      FROM journal_entries je
      JOIN transactions t ON je.transaction_id = t.id
      WHERE t.transaction_date >= ? 
        AND t.transaction_date <= ?
        AND je.deleted_at IS NULL
        AND t.deleted_at IS NULL
    `, [startDate, endDate]);

    const [onlineByDate] = await onlineConn.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(DISTINCT je.transaction_id) as unique_transactions,
        COUNT(CASE WHEN je.entry_type = 'debit' THEN 1 END) as debit_count,
        COUNT(CASE WHEN je.entry_type = 'credit' THEN 1 END) as credit_count,
        COALESCE(SUM(CASE WHEN je.entry_type = 'debit' THEN je.amount ELSE 0 END), 0) as total_debits,
        COALESCE(SUM(CASE WHEN je.entry_type = 'credit' THEN je.amount ELSE 0 END), 0) as total_credits
      FROM journal_entries je
      JOIN transactions t ON je.transaction_id = t.id
      WHERE t.transaction_date >= ? 
        AND t.transaction_date <= ?
        AND je.deleted_at IS NULL
        AND t.deleted_at IS NULL
    `, [startDate, endDate]);

    console.log('   LOCALHOST:');
    console.log(`     Total entries: ${localhostByDate[0].total}`);
    console.log(`     Unique transactions: ${localhostByDate[0].unique_transactions}`);
    console.log(`     Debits: ${localhostByDate[0].debit_count} entries, $${parseFloat(localhostByDate[0].total_debits).toFixed(2)}`);
    console.log(`     Credits: ${localhostByDate[0].credit_count} entries, $${parseFloat(localhostByDate[0].total_credits).toFixed(2)}`);
    console.log('');
    console.log('   ONLINE:');
    console.log(`     Total entries: ${onlineByDate[0].total}`);
    console.log(`     Unique transactions: ${onlineByDate[0].unique_transactions}`);
    console.log(`     Debits: ${onlineByDate[0].debit_count} entries, $${parseFloat(onlineByDate[0].total_debits).toFixed(2)}`);
    console.log(`     Credits: ${onlineByDate[0].credit_count} entries, $${parseFloat(onlineByDate[0].total_credits).toFixed(2)}`);
    console.log('');

    // 5. Find missing journal entries (entries in localhost but not in online)
    console.log('5️⃣  Finding Missing Journal Entries (in localhost but not in online)...');
    const [missingEntries] = await localhostConn.query(`
      SELECT 
        je.id,
        je.transaction_id,
        je.account_id,
        je.entry_type,
        je.amount,
        je.description,
        t.transaction_date,
        t.transaction_type,
        coa.code as account_code,
        coa.name as account_name,
        coa.type as account_type
      FROM journal_entries je
      JOIN transactions t ON je.transaction_id = t.id
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      WHERE je.deleted_at IS NULL
        AND t.deleted_at IS NULL
        AND coa.deleted_at IS NULL
        AND NOT EXISTS (
          SELECT 1 
          FROM journal_entries je2
          WHERE je2.id = je.id
            AND je2.deleted_at IS NULL
        )
      ORDER BY je.id
      LIMIT 50
    `);

    // Check which ones actually exist on online
    if (missingEntries.length > 0) {
      const missingIds = missingEntries.map(e => e.id);
      const [onlineExists] = await onlineConn.query(`
        SELECT id
        FROM journal_entries
        WHERE id IN (?)
          AND deleted_at IS NULL
      `, [missingIds]);

      const existingIds = new Set(onlineExists.map(e => e.id));
      const trulyMissing = missingEntries.filter(e => !existingIds.has(e.id));

      console.log(`   Found ${trulyMissing.length} missing journal entries (showing first 20):`);
      trulyMissing.slice(0, 20).forEach((entry, idx) => {
        console.log(`     ${idx + 1}. ID ${entry.id} | Txn ${entry.transaction_id} (${entry.transaction_type}) | ${entry.transaction_date} | ${entry.entry_type.toUpperCase()} $${entry.amount} → ${entry.account_code} - ${entry.account_name} (${entry.account_type})`);
      });
      if (trulyMissing.length > 20) {
        console.log(`     ... and ${trulyMissing.length - 20} more`);
      }
    } else {
      console.log('   ✅ No missing entries found (all localhost entries exist on online)');
    }
    console.log('');

    // 6. Find extra journal entries (entries in online but not in localhost)
    console.log('6️⃣  Finding Extra Journal Entries (in online but not in localhost)...');
    const [extraEntries] = await onlineConn.query(`
      SELECT 
        je.id,
        je.transaction_id,
        je.account_id,
        je.entry_type,
        je.amount,
        je.description,
        t.transaction_date,
        t.transaction_type,
        coa.code as account_code,
        coa.name as account_name,
        coa.type as account_type
      FROM journal_entries je
      JOIN transactions t ON je.transaction_id = t.id
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      WHERE je.deleted_at IS NULL
        AND t.deleted_at IS NULL
        AND coa.deleted_at IS NULL
        AND NOT EXISTS (
          SELECT 1 
          FROM journal_entries je2
          WHERE je2.id = je.id
            AND je2.deleted_at IS NULL
        )
      ORDER BY je.id
      LIMIT 50
    `);

    // Check which ones actually exist on localhost
    if (extraEntries.length > 0) {
      const extraIds = extraEntries.map(e => e.id);
      const [localhostExists] = await localhostConn.query(`
        SELECT id
        FROM journal_entries
        WHERE id IN (?)
          AND deleted_at IS NULL
      `, [extraIds]);

      const existingIds = new Set(localhostExists.map(e => e.id));
      const trulyExtra = extraEntries.filter(e => !existingIds.has(e.id));

      console.log(`   Found ${trulyExtra.length} extra journal entries (showing first 20):`);
      trulyExtra.slice(0, 20).forEach((entry, idx) => {
        console.log(`     ${idx + 1}. ID ${entry.id} | Txn ${entry.transaction_id} (${entry.transaction_type}) | ${entry.transaction_date} | ${entry.entry_type.toUpperCase()} $${entry.amount} → ${entry.account_code} - ${entry.account_name} (${entry.account_type})`);
      });
      if (trulyExtra.length > 20) {
        console.log(`     ... and ${trulyExtra.length - 20} more`);
      }
    } else {
      console.log('   ✅ No extra entries found (all online entries exist on localhost)');
    }
    console.log('');

    // 7. Compare journal entry IDs range
    console.log('7️⃣  Journal Entry ID Ranges...');
    const [localhostIdRange] = await localhostConn.query(`
      SELECT 
        MIN(id) as min_id,
        MAX(id) as max_id,
        COUNT(*) as total
      FROM journal_entries
      WHERE deleted_at IS NULL
    `);

    const [onlineIdRange] = await onlineConn.query(`
      SELECT 
        MIN(id) as min_id,
        MAX(id) as max_id,
        COUNT(*) as total
      FROM journal_entries
      WHERE deleted_at IS NULL
    `);

    console.log('   LOCALHOST:');
    console.log(`     ID Range: ${localhostIdRange[0].min_id} - ${localhostIdRange[0].max_id}`);
    console.log(`     Total: ${localhostIdRange[0].total}`);
    console.log('');
    console.log('   ONLINE:');
    console.log(`     ID Range: ${onlineIdRange[0].min_id} - ${onlineIdRange[0].max_id}`);
    console.log(`     Total: ${onlineIdRange[0].total}`);
    console.log('');

    // 8. Compare timestamps (created_at, updated_at) and transaction dates
    console.log('8️⃣  Comparing Timestamps and Transaction Dates...');
    
    // Get all journal entries with their timestamps from localhost
    const [localhostTimestamps] = await localhostConn.query(`
      SELECT 
        je.id,
        je.transaction_id,
        je.created_at as je_created_at,
        je.updated_at as je_updated_at,
        t.transaction_date,
        t.created_at as tx_created_at,
        t.transaction_type,
        je.entry_type,
        je.amount,
        coa.code as account_code,
        coa.name as account_name
      FROM journal_entries je
      JOIN transactions t ON je.transaction_id = t.id
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      WHERE je.deleted_at IS NULL
        AND t.deleted_at IS NULL
        AND coa.deleted_at IS NULL
      ORDER BY je.id
    `);

    // Get all journal entries with their timestamps from online
    const [onlineTimestamps] = await onlineConn.query(`
      SELECT 
        je.id,
        je.transaction_id,
        je.created_at as je_created_at,
        je.updated_at as je_updated_at,
        t.transaction_date,
        t.created_at as tx_created_at,
        t.transaction_type,
        je.entry_type,
        je.amount,
        coa.code as account_code,
        coa.name as account_name
      FROM journal_entries je
      JOIN transactions t ON je.transaction_id = t.id
      JOIN chart_of_accounts coa ON je.account_id = coa.id
      WHERE je.deleted_at IS NULL
        AND t.deleted_at IS NULL
        AND coa.deleted_at IS NULL
      ORDER BY je.id
    `);

    // Create maps for easy lookup
    const localhostMap = new Map();
    localhostTimestamps.forEach(entry => {
      localhostMap.set(entry.id, entry);
    });

    const onlineMap = new Map();
    onlineTimestamps.forEach(entry => {
      onlineMap.set(entry.id, entry);
    });

    // Find differences
    const differences = [];
    
    // Check entries that exist in both
    localhostMap.forEach((localhostEntry, id) => {
      const onlineEntry = onlineMap.get(id);
      if (onlineEntry) {
        const diff = {
          id: id,
          transaction_id: localhostEntry.transaction_id,
          transaction_type: localhostEntry.transaction_type,
          differences: []
        };

        // Compare transaction_date - use raw string values to avoid timezone conversion
        const localhostTxDate = localhostEntry.transaction_date ? String(localhostEntry.transaction_date).split('T')[0] : null;
        const onlineTxDate = onlineEntry.transaction_date ? String(onlineEntry.transaction_date).split('T')[0] : null;
        if (localhostTxDate !== onlineTxDate) {
          diff.differences.push({
            field: 'transaction_date',
            localhost: localhostTxDate,
            online: onlineTxDate
          });
        }

        // Compare journal entry created_at
        const localhostJECreated = localhostEntry.je_created_at ? new Date(localhostEntry.je_created_at).toISOString() : null;
        const onlineJECreated = onlineEntry.je_created_at ? new Date(onlineEntry.je_created_at).toISOString() : null;
        if (localhostJECreated !== onlineJECreated) {
          diff.differences.push({
            field: 'je.created_at',
            localhost: localhostJECreated,
            online: onlineJECreated
          });
        }

        // Compare journal entry updated_at
        const localhostJEUpdated = localhostEntry.je_updated_at ? new Date(localhostEntry.je_updated_at).toISOString() : null;
        const onlineJEUpdated = onlineEntry.je_updated_at ? new Date(onlineEntry.je_updated_at).toISOString() : null;
        if (localhostJEUpdated !== onlineJEUpdated) {
          diff.differences.push({
            field: 'je.updated_at',
            localhost: localhostJEUpdated,
            online: onlineJEUpdated
          });
        }

        // Compare transaction created_at
        const localhostTxCreated = localhostEntry.tx_created_at ? new Date(localhostEntry.tx_created_at).toISOString() : null;
        const onlineTxCreated = onlineEntry.tx_created_at ? new Date(onlineEntry.tx_created_at).toISOString() : null;
        if (localhostTxCreated !== onlineTxCreated) {
          diff.differences.push({
            field: 'tx.created_at',
            localhost: localhostTxCreated,
            online: onlineTxCreated
          });
        }

        if (diff.differences.length > 0) {
          differences.push(diff);
        }
      }
    });

    if (differences.length > 0) {
      console.log(`   Found ${differences.length} journal entries with different timestamps/dates:`);
      console.log('');
      
      // Group by transaction_date difference (most important)
      const txDateDiffs = differences.filter(d => d.differences.some(diff => diff.field === 'transaction_date'));
      if (txDateDiffs.length > 0) {
        console.log(`   ⚠️  ${txDateDiffs.length} entries have DIFFERENT TRANSACTION DATES (this affects revenue queries!):`);
        txDateDiffs.slice(0, 20).forEach((diff, idx) => {
          const txDateDiff = diff.differences.find(d => d.field === 'transaction_date');
          console.log(`     ${idx + 1}. Journal ID ${diff.id} | Txn ${diff.transaction_id} (${diff.transaction_type})`);
          console.log(`        Localhost: ${txDateDiff.localhost}`);
          console.log(`        Online: ${txDateDiff.online}`);
        });
        if (txDateDiffs.length > 20) {
          console.log(`     ... and ${txDateDiffs.length - 20} more`);
        }
        console.log('');
      }

      // Show other timestamp differences
      const otherDiffs = differences.filter(d => !d.differences.some(diff => diff.field === 'transaction_date'));
      if (otherDiffs.length > 0) {
        console.log(`   📅 ${otherDiffs.length} entries have different timestamps (created_at/updated_at):`);
        otherDiffs.slice(0, 10).forEach((diff, idx) => {
          console.log(`     ${idx + 1}. Journal ID ${diff.id} | Txn ${diff.transaction_id}`);
          diff.differences.forEach(d => {
            console.log(`        ${d.field}:`);
            console.log(`          Localhost: ${d.localhost}`);
            console.log(`          Online: ${d.online}`);
          });
        });
        if (otherDiffs.length > 10) {
          console.log(`     ... and ${otherDiffs.length - 10} more`);
        }
        console.log('');
      }
    } else {
      console.log('   ✅ All journal entries have identical timestamps and dates');
      console.log('');
    }

    console.log('='.repeat(80));
    console.log('✅ COMPARISON COMPLETE');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('');
    console.error('❌ ERROR:');
    console.error(error.message);
    console.error('');
    if (error.stack) {
      console.error('Stack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    if (localhostConn) {
      await localhostConn.end();
    }
    if (onlineConn) {
      await onlineConn.end();
    }
    console.log('');
    console.log('🔌 Database connections closed.');
  }
}

// Run the comparison
compareJournals()
  .then(() => {
    console.log('');
    console.log('✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('');
    console.error('❌ Script failed:');
    console.error(error);
    process.exit(1);
  });

