require('dotenv').config();
const mysql = require('mysql2/promise');
const XLSX = require('xlsx');

async function exportCorrectBalances() {
  console.log('📊 Exporting CORRECT Student Balances...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    // Get students with ACTIVE enrollments and their correct balances
    const [activeStudents] = await connection.execute(`
      SELECT 
        s.id as student_id,
        s.student_id as student_number,
        s.full_name,
        s.status as student_status,
        bh.name as boarding_house,
        r.name as room_name,
        se.id as enrollment_id,
        COALESCE(sab.current_balance, 0) as current_balance,
        CASE 
          WHEN COALESCE(sab.current_balance, 0) < 0 THEN 'Owes'
          WHEN COALESCE(sab.current_balance, 0) > 0 THEN 'Prepaid'
          ELSE 'Zero Balance'
        END as balance_status,
        'Active Enrollment' as enrollment_status
      FROM students s
      JOIN student_enrollments se ON s.id = se.student_id
      JOIN boarding_houses bh ON se.boarding_house_id = bh.id
      LEFT JOIN rooms r ON se.room_id = r.id
      LEFT JOIN student_account_balances sab ON s.id = sab.student_id AND se.id = sab.enrollment_id
      WHERE s.deleted_at IS NULL
        AND se.deleted_at IS NULL
        AND (se.expected_end_date IS NULL OR se.expected_end_date >= CURRENT_DATE)
      ORDER BY s.full_name
    `);

    console.log(`✅ Found ${activeStudents.length} students with active enrollments\n`);

    // Calculate summary
    const totalDebtors = activeStudents
      .filter(s => parseFloat(s.current_balance) < 0)
      .reduce((sum, s) => sum + Math.abs(parseFloat(s.current_balance)), 0);
    
    const totalPrepayments = activeStudents
      .filter(s => parseFloat(s.current_balance) > 0)
      .reduce((sum, s) => sum + parseFloat(s.current_balance), 0);
    
    const debtorsCount = activeStudents.filter(s => parseFloat(s.current_balance) < 0).length;
    const prepaymentsCount = activeStudents.filter(s => parseFloat(s.current_balance) > 0).length;
    const zeroBalanceCount = activeStudents.filter(s => parseFloat(s.current_balance) === 0).length;

    console.log('📊 CORRECT TOTALS (Active Enrollments Only):');
    console.log(`Total Students: ${activeStudents.length}`);
    console.log(`Students Who Owe (Debtors): ${debtorsCount} = $${totalDebtors.toFixed(2)}`);
    console.log(`Students Who Prepaid: ${prepaymentsCount} = $${totalPrepayments.toFixed(2)}`);
    console.log(`Students With Zero Balance: ${zeroBalanceCount}`);

    // Prepare data for Excel
    const excelData = activeStudents.map(student => ({
      'Student ID': student.student_number || student.student_id,
      'Full Name': student.full_name,
      'Status': student.student_status || 'Active',
      'Boarding House': student.boarding_house,
      'Room': student.room_name || 'Not Assigned',
      'Enrollment ID': student.enrollment_id,
      'Current Balance': parseFloat(student.current_balance),
      'Balance Status': student.balance_status,
      'Enrollment Status': student.enrollment_status
    }));

    // Add summary rows
    excelData.push({});
    excelData.push({ 'Student ID': 'SUMMARY', 'Full Name': '', 'Status': '', 'Boarding House': '', 'Room': '', 'Enrollment ID': '', 'Current Balance': '', 'Balance Status': '', 'Enrollment Status': '' });
    excelData.push({});
    excelData.push({ 'Student ID': 'Total Students (Active Enrollments)', 'Full Name': activeStudents.length, 'Status': '', 'Boarding House': '', 'Room': '', 'Enrollment ID': '', 'Current Balance': '', 'Balance Status': '', 'Enrollment Status': '' });
    excelData.push({ 'Student ID': 'Students Who Owe (Debtors)', 'Full Name': debtorsCount, 'Status': '', 'Boarding House': '', 'Room': '', 'Enrollment ID': '', 'Current Balance': totalDebtors, 'Balance Status': '', 'Enrollment Status': '' });
    excelData.push({ 'Student ID': 'Students Who Prepaid', 'Full Name': prepaymentsCount, 'Status': '', 'Boarding House': '', 'Room': '', 'Enrollment ID': '', 'Current Balance': totalPrepayments, 'Balance Status': '', 'Enrollment Status': '' });
    excelData.push({ 'Student ID': 'Students With Zero Balance', 'Full Name': zeroBalanceCount, 'Status': '', 'Boarding House': '', 'Room': '', 'Enrollment ID': '', 'Current Balance': 0, 'Balance Status': '', 'Enrollment Status': '' });
    excelData.push({});
    excelData.push({ 'Student ID': 'Net Balance (Prepayments - Debtors)', 'Full Name': '', 'Status': '', 'Boarding House': '', 'Room': '', 'Enrollment ID': '', 'Current Balance': totalPrepayments - totalDebtors, 'Balance Status': '', 'Enrollment Status': '' });

    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    ws['!cols'] = [
      { wch: 15 }, // Student ID
      { wch: 30 }, // Full Name
      { wch: 10 }, // Status
      { wch: 20 }, // Boarding House
      { wch: 15 }, // Room
      { wch: 15 }, // Enrollment ID
      { wch: 15 }, // Current Balance
      { wch: 15 }, // Balance Status
      { wch: 20 }  // Enrollment Status
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Active Student Balances');

    // Write to file
    const filename = `student_balances_CORRECT_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);

    console.log(`\n✅ Excel file created: ${filename}`);
    console.log('\n💡 This file shows ONLY students with active enrollments.');
    console.log('   This is the CORRECT figure for Balance Sheet prepayments.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

exportCorrectBalances();
