require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixDebtorsIssues() {
  console.log('🔧 Fixing Debtors Issues...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    await connection.beginTransaction();

    // Step 1: Fix Emma Yoradin from -$80 to -$20
    console.log('Step 1: Fixing Emma Yoradin balance...');
    const [emma] = await connection.execute(`
      SELECT s.id, s.full_name, sab.id as balance_id, sab.current_balance
      FROM students s
      JOIN student_account_balances sab ON s.id = sab.student_id
      WHERE s.full_name LIKE '%Emma%Yoradin%'
        AND s.deleted_at IS NULL
        AND sab.deleted_at IS NULL
    `);

    if (emma.length > 0) {
      console.log(`  Found: ${emma[0].full_name}`);
      console.log(`  Current balance: $${emma[0].current_balance}`);
      
      // Update to -20
      await connection.execute(`
        UPDATE student_account_balances
        SET current_balance = -20,
            updated_at = NOW()
        WHERE student_id = ?
      `, [emma[0].id]);
      
      console.log(`  ✅ Updated to -$20.00\n`);
    }

    // Step 2: Check and fix Dion sengamai duplicates
    console.log('Step 2: Checking Dion sengamai for duplicates...');
    const [dion] = await connection.execute(`
      SELECT s.id, s.full_name, sab.id as balance_id, sab.current_balance, sab.enrollment_id
      FROM students s
      JOIN student_account_balances sab ON s.id = sab.student_id
      WHERE s.full_name LIKE '%Dion%sengamai%'
        AND s.deleted_at IS NULL
        AND sab.deleted_at IS NULL
      ORDER BY sab.id
    `);

    if (dion.length > 1) {
      console.log(`  Found ${dion.length} balance records for ${dion[0].full_name}`);
      // Keep the first one, soft-delete the rest
      for (let i = 1; i < dion.length; i++) {
        await connection.execute(`
          UPDATE student_account_balances
          SET deleted_at = NOW()
          WHERE id = ?
        `, [dion[i].balance_id]);
        console.log(`  ✅ Deleted duplicate balance record ID ${dion[i].balance_id}`);
      }
    } else if (dion.length === 1) {
      console.log(`  ✅ No duplicates found for ${dion[0].full_name}\n`);
    }

    // Step 3: Check and fix Chantelle Gora duplicates
    console.log('\nStep 3: Checking Chantelle Gora for duplicates...');
    const [chantelle] = await connection.execute(`
      SELECT s.id, s.full_name, sab.id as balance_id, sab.current_balance, sab.enrollment_id
      FROM students s
      JOIN student_account_balances sab ON s.id = sab.student_id
      WHERE s.full_name LIKE '%Chantelle%Gora%'
        AND s.deleted_at IS NULL
        AND sab.deleted_at IS NULL
      ORDER BY sab.id
    `);

    if (chantelle.length > 1) {
      console.log(`  Found ${chantelle.length} balance records for ${chantelle[0].full_name}`);
      // Keep the first one, soft-delete the rest
      for (let i = 1; i < chantelle.length; i++) {
        await connection.execute(`
          UPDATE student_account_balances
          SET deleted_at = NOW()
          WHERE id = ?
        `, [chantelle[i].balance_id]);
        console.log(`  ✅ Deleted duplicate balance record ID ${chantelle[i].balance_id}`);
      }
    } else if (chantelle.length === 1) {
      console.log(`  ✅ No duplicates found for ${chantelle[0].full_name}\n`);
    }

    // Step 4: Check and fix Bertha Majoni duplicates
    console.log('\nStep 4: Checking Bertha Majoni for duplicates...');
    const [bertha] = await connection.execute(`
      SELECT s.id, s.full_name, sab.id as balance_id, sab.current_balance, sab.enrollment_id
      FROM students s
      JOIN student_account_balances sab ON s.id = sab.student_id
      WHERE s.full_name LIKE '%Bertha%Majoni%'
        AND s.deleted_at IS NULL
        AND sab.deleted_at IS NULL
      ORDER BY sab.id
    `);

    if (bertha.length > 1) {
      console.log(`  Found ${bertha.length} balance records for ${bertha[0].full_name}`);
      // Keep the first one, soft-delete the rest
      for (let i = 1; i < bertha.length; i++) {
        await connection.execute(`
          UPDATE student_account_balances
          SET deleted_at = NOW()
          WHERE id = ?
        `, [bertha[i].balance_id]);
        console.log(`  ✅ Deleted duplicate balance record ID ${bertha[i].balance_id}`);
      }
    } else if (bertha.length === 1) {
      console.log(`  ✅ No duplicates found for ${bertha[0].full_name}\n`);
    }

    await connection.commit();

    // Calculate new totals
    console.log('\n' + '='.repeat(80));
    const [totals] = await connection.execute(`
      SELECT 
        COUNT(*) as total_debtors,
        SUM(ABS(sab.current_balance)) as total_debt
      FROM students s
      JOIN student_account_balances sab ON s.id = sab.student_id
      WHERE s.deleted_at IS NULL
        AND sab.deleted_at IS NULL
        AND (s.status = 'Active' OR s.status IS NULL)
        AND sab.current_balance < 0
    `);

    console.log('\n📊 Updated Debtors Summary:');
    console.log(`  Total Debtors: ${totals[0].total_debtors}`);
    console.log(`  Total Debt: $${parseFloat(totals[0].total_debt || 0).toFixed(2)}`);

    // List all debtors
    const [allDebtors] = await connection.execute(`
      SELECT 
        s.full_name,
        sab.current_balance,
        r.name as room_name
      FROM students s
      JOIN student_account_balances sab ON s.id = sab.student_id
      LEFT JOIN student_enrollments se ON s.id = se.student_id AND se.deleted_at IS NULL
      LEFT JOIN rooms r ON se.room_id = r.id
      WHERE s.deleted_at IS NULL
        AND sab.deleted_at IS NULL
        AND (s.status = 'Active' OR s.status IS NULL)
        AND sab.current_balance < 0
      ORDER BY sab.current_balance ASC
    `);

    console.log('\n📋 All Debtors After Fix:');
    console.log('='.repeat(80));
    allDebtors.forEach((debtor, index) => {
      console.log(`${index + 1}. ${debtor.full_name} (${debtor.room_name || 'No Room'}) = -$${Math.abs(debtor.current_balance)}`);
    });

    console.log('\n✅ All debtor issues fixed successfully!');

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

fixDebtorsIssues();

