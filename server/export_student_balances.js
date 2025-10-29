require('dotenv').config();
const mysql = require('mysql2/promise');
const XLSX = require('xlsx');

async function exportStudentBalances() {
  console.log('📊 Exporting Student Balances to Excel...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    // Get all students with their balances
    const [students] = await connection.execute(`
      SELECT 
        s.id as student_id,
        s.student_id as student_number,
        s.full_name,
        s.status,
        bh.name as boarding_house,
        r.name as room_name,
        COALESCE(sab.current_balance, 0) as current_balance,
        CASE 
          WHEN sab.current_balance < 0 THEN 'Owes'
          WHEN sab.current_balance > 0 THEN 'Prepaid'
          ELSE 'Zero Balance'
        END as balance_status,
        sab.currency,
        sab.updated_at as balance_last_updated
      FROM students s
      LEFT JOIN boarding_houses bh ON s.boarding_house_id = bh.id
      LEFT JOIN student_enrollments se ON s.id = se.student_id AND se.deleted_at IS NULL
      LEFT JOIN rooms r ON se.room_id = r.id
      LEFT JOIN student_account_balances sab ON s.id = sab.student_id
      WHERE s.deleted_at IS NULL
      ORDER BY s.full_name
    `);

    console.log(`Found ${students.length} students\n`);

    // Prepare data for Excel
    const excelData = students.map(student => ({
      'Student ID': student.student_number || student.student_id,
      'Full Name': student.full_name,
      'Status': student.status,
      'Boarding House': student.boarding_house || 'Not Assigned',
      'Room': student.room_name || 'Not Assigned',
      'Current Balance': parseFloat(student.current_balance),
      'Balance Status': student.balance_status,
      'Currency': student.currency || 'USD',
      'Last Updated': student.balance_last_updated ? new Date(student.balance_last_updated).toLocaleDateString() : 'N/A'
    }));

    // Calculate summary
    const totalDebtors = students
      .filter(s => parseFloat(s.current_balance) < 0)
      .reduce((sum, s) => sum + Math.abs(parseFloat(s.current_balance)), 0);
    
    const totalPrepayments = students
      .filter(s => parseFloat(s.current_balance) > 0)
      .reduce((sum, s) => sum + parseFloat(s.current_balance), 0);
    
    const debtorsCount = students.filter(s => parseFloat(s.current_balance) < 0).length;
    const prepaymentsCount = students.filter(s => parseFloat(s.current_balance) > 0).length;
    const zeroBalanceCount = students.filter(s => parseFloat(s.current_balance) === 0).length;

    // Add summary rows
    excelData.push({});
    excelData.push({ 'Student ID': 'SUMMARY', 'Full Name': '', 'Status': '', 'Boarding House': '', 'Room': '', 'Current Balance': '', 'Balance Status': '', 'Currency': '', 'Last Updated': '' });
    excelData.push({});
    excelData.push({ 'Student ID': 'Total Students', 'Full Name': students.length, 'Status': '', 'Boarding House': '', 'Room': '', 'Current Balance': '', 'Balance Status': '', 'Currency': '', 'Last Updated': '' });
    excelData.push({ 'Student ID': 'Students Who Owe (Debtors)', 'Full Name': debtorsCount, 'Status': '', 'Boarding House': '', 'Room': '', 'Current Balance': totalDebtors, 'Balance Status': '', 'Currency': '', 'Last Updated': '' });
    excelData.push({ 'Student ID': 'Students Who Prepaid', 'Full Name': prepaymentsCount, 'Status': '', 'Boarding House': '', 'Room': '', 'Current Balance': totalPrepayments, 'Balance Status': '', 'Currency': '', 'Last Updated': '' });
    excelData.push({ 'Student ID': 'Students With Zero Balance', 'Full Name': zeroBalanceCount, 'Status': '', 'Boarding House': '', 'Room': '', 'Current Balance': 0, 'Balance Status': '', 'Currency': '', 'Last Updated': '' });
    excelData.push({});
    excelData.push({ 'Student ID': 'Net Balance (Prepayments - Debtors)', 'Full Name': '', 'Status': '', 'Boarding House': '', 'Room': '', 'Current Balance': totalPrepayments - totalDebtors, 'Balance Status': '', 'Currency': '', 'Last Updated': '' });

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
      { wch: 15 }, // Current Balance
      { wch: 15 }, // Balance Status
      { wch: 10 }, // Currency
      { wch: 15 }  // Last Updated
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Student Balances');

    // Write to file
    const filename = `student_balances_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);

    console.log('✅ Excel file created successfully!');
    console.log(`📁 File: ${filename}`);
    console.log('\n📊 Summary:');
    console.log(`Total Students: ${students.length}`);
    console.log(`Students Who Owe: ${debtorsCount} (Total: $${totalDebtors.toFixed(2)})`);
    console.log(`Students Who Prepaid: ${prepaymentsCount} (Total: $${totalPrepayments.toFixed(2)})`);
    console.log(`Students With Zero Balance: ${zeroBalanceCount}`);
    console.log(`Net Balance: $${(totalPrepayments - totalDebtors).toFixed(2)}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

exportStudentBalances();
