require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkStudentBalancesStatus() {
  console.log('🔍 Checking if student balances were affected by October invoices...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    // Check current student balance summary
    console.log('📊 CURRENT STUDENT BALANCE SUMMARY:');
    const [balanceSummary] = await connection.execute(`
      SELECT 
        COUNT(*) as total_students,
        SUM(CASE WHEN sab.current_balance < 0 THEN 1 ELSE 0 END) as students_with_debt,
        SUM(CASE WHEN sab.current_balance > 0 THEN 1 ELSE 0 END) as students_with_credit,
        SUM(CASE WHEN sab.current_balance = 0 THEN 1 ELSE 0 END) as students_with_zero,
        SUM(CASE WHEN sab.current_balance < 0 THEN ABS(sab.current_balance) ELSE 0 END) as total_debt,
        SUM(CASE WHEN sab.current_balance > 0 THEN sab.current_balance ELSE 0 END) as total_credit
      FROM students s
      JOIN student_account_balances sab ON s.id = sab.student_id
      WHERE s.deleted_at IS NULL
        AND sab.deleted_at IS NULL
        AND (s.status = 'Active' OR s.status IS NULL)
    `);
    console.table(balanceSummary);

    // Check how many active students should have been invoiced for October
    console.log('\n📋 ACTIVE STUDENTS WHO SHOULD HAVE OCTOBER INVOICES:');
    const [activeStudents] = await connection.execute(`
      SELECT 
        COUNT(*) as total_active,
        COUNT(CASE WHEN s.full_name NOT LIKE '%Leona%Dengu%' 
                    AND s.full_name NOT LIKE '%Shelter%Masosonere%' 
                    AND s.full_name NOT LIKE '%Charmain%Tinarwo%'
                    AND s.full_name NOT LIKE '%Tanaka%Matematema%'
                    THEN 1 END) as should_be_invoiced
      FROM students s
      JOIN student_enrollments se ON s.id = se.student_id
      WHERE s.deleted_at IS NULL
        AND se.deleted_at IS NULL
        AND (s.status = 'Active' OR s.status IS NULL)
        AND (se.expected_end_date IS NULL OR se.expected_end_date >= '2025-10-01')
    `);
    console.table(activeStudents);

    // Sample of student balances (first 20)
    console.log('\n📝 SAMPLE STUDENT BALANCES (First 20 Active Students):');
    const [sampleBalances] = await connection.execute(`
      SELECT 
        s.full_name,
        r.name as room,
        se.agreed_amount as monthly_rent,
        sab.current_balance,
        CASE 
          WHEN sab.current_balance < 0 THEN 'Owes'
          WHEN sab.current_balance > 0 THEN 'Prepaid'
          ELSE 'Zero'
        END as status
      FROM students s
      JOIN student_enrollments se ON s.id = se.student_id
      LEFT JOIN rooms r ON se.room_id = r.id
      LEFT JOIN student_account_balances sab ON s.id = sab.student_id AND sab.deleted_at IS NULL
      WHERE s.deleted_at IS NULL
        AND se.deleted_at IS NULL
        AND (s.status = 'Active' OR s.status IS NULL)
      ORDER BY s.full_name
      LIMIT 20
    `);
    console.table(sampleBalances);

    // Check if ANY student has a balance that matches their monthly rent (indicating invoice was created)
    console.log('\n🔍 CHECKING FOR OCTOBER INVOICE IMPACT:');
    const [invoiceImpact] = await connection.execute(`
      SELECT 
        s.full_name,
        se.agreed_amount as monthly_rent,
        sab.current_balance,
        (sab.current_balance * -1) as absolute_debt
      FROM students s
      JOIN student_enrollments se ON s.id = se.student_id
      LEFT JOIN student_account_balances sab ON s.id = sab.student_id AND sab.deleted_at IS NULL
      WHERE s.deleted_at IS NULL
        AND se.deleted_at IS NULL
        AND (s.status = 'Active' OR s.status IS NULL)
        AND sab.current_balance <= (se.agreed_amount * -1)
      ORDER BY sab.current_balance ASC
      LIMIT 10
    `);
    
    if (invoiceImpact.length > 0) {
      console.log('Students whose debt is >= their monthly rent (possible October invoice):');
      console.table(invoiceImpact);
    } else {
      console.log('⚠️  NO students found with debt >= their monthly rent');
      console.log('   This suggests October invoices were NOT created!');
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 CONCLUSION:');
    console.log('='.repeat(80));
    console.log(`Total Active Students: ${activeStudents[0].total_active}`);
    console.log(`Should Have Been Invoiced: ${activeStudents[0].should_be_invoiced || activeStudents[0].total_active}`);
    console.log(`Students Currently in Debt: ${balanceSummary[0].students_with_debt}`);
    console.log(`Total Outstanding Debt: $${parseFloat(balanceSummary[0].total_debt || 0).toFixed(2)}`);
    console.log(`Total Prepayments: $${parseFloat(balanceSummary[0].total_credit || 0).toFixed(2)}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await connection.end();
  }
}

checkStudentBalancesStatus();

