require('dotenv').config();
const mysql = require('mysql2/promise');
const XLSX = require('xlsx');

async function exportStudentsWithBalances() {
  console.log('📊 Exporting Students with Balances...\n');

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
        s.id,
        s.student_id,
        s.full_name,
        s.status,
        bh.name as boarding_house,
        r.name as room_name,
        se.id as enrollment_id,
        COALESCE(sab.current_balance, 0) as balance,
        sab.currency,
        sab.updated_at as balance_last_updated,
        CASE 
          WHEN sab.current_balance < 0 THEN 'Owes'
          WHEN sab.current_balance > 0 THEN 'Prepaid'
          ELSE 'Zero Balance'
        END as balance_status,
        ABS(COALESCE(sab.current_balance, 0)) as absolute_balance
      FROM students s
      LEFT JOIN student_enrollments se ON s.id = se.student_id AND se.deleted_at IS NULL
      LEFT JOIN boarding_houses bh ON se.boarding_house_id = bh.id
      LEFT JOIN rooms r ON se.room_id = r.id
      LEFT JOIN student_account_balances sab ON s.id = sab.student_id AND se.id = sab.enrollment_id
      WHERE s.deleted_at IS NULL
      ORDER BY s.full_name
    `);

    console.log(`✅ Found ${students.length} students\n`);

    // Prepare data for Excel
    const excelData = students.map(student => ({
      'ID': student.id,
      'Student ID': student.student_id,
      'Full Name': student.full_name,
      'Status': student.status || 'Active',
      'Boarding House': student.boarding_house || 'Not Assigned',
      'Room': student.room_name || 'Not Assigned',
      'Enrollment ID': student.enrollment_id || '',
      'Balance': parseFloat(student.balance),
      'Balance Status': student.balance_status,
      'Absolute Balance': parseFloat(student.absolute_balance),
      'Currency': student.currency || 'USD',
      'Last Updated': student.balance_last_updated ? new Date(student.balance_last_updated).toLocaleDateString() : 'N/A'
    }));

    // Calculate summary
    const totalStudents = students.length;
    const studentsWithBalances = students.filter(s => parseFloat(s.balance) !== 0).length;
    const totalDebtors = students.filter(s => parseFloat(s.balance) < 0).length;
    const totalPrepayments = students.filter(s => parseFloat(s.balance) > 0).length;
    const totalZero = students.filter(s => parseFloat(s.balance) === 0).length;
    
    const sumDebtors = students
      .filter(s => parseFloat(s.balance) < 0)
      .reduce((sum, s) => sum + Math.abs(parseFloat(s.balance)), 0);
    
    const sumPrepayments = students
      .filter(s => parseFloat(s.balance) > 0)
      .reduce((sum, s) => sum + parseFloat(s.balance), 0);

    // Add summary rows
    excelData.push({});
    excelData.push({ 'ID': 'SUMMARY', 'Student ID': '', 'Full Name': '', 'Status': '', 'Boarding House': '', 'Room': '', 'Enrollment ID': '', 'Balance': '', 'Balance Status': '', 'Absolute Balance': '', 'Currency': '', 'Last Updated': '' });
    excelData.push({});
    excelData.push({ 'ID': 'Total Students', 'Student ID': totalStudents, 'Full Name': '', 'Status': '', 'Boarding House': '', 'Room': '', 'Enrollment ID': '', 'Balance': '', 'Balance Status': '', 'Absolute Balance': '', 'Currency': '', 'Last Updated': '' });
    excelData.push({ 'ID': 'Students Who Owe', 'Student ID': totalDebtors, 'Full Name': '', 'Status': '', 'Boarding House': '', 'Room': '', 'Enrollment ID': '', 'Balance': sumDebtors, 'Balance Status': '', 'Absolute Balance': '', 'Currency': '', 'Last Updated': '' });
    excelData.push({ 'ID': 'Students Who Prepaid', 'Student ID': totalPrepayments, 'Full Name': '', 'Status': '', 'Boarding House': '', 'Room': '', 'Enrollment ID': '', 'Balance': sumPrepayments, 'Balance Status': '', 'Absolute Balance': '', 'Currency': '', 'Last Updated': '' });
    excelData.push({ 'ID': 'Students Zero Balance', 'Student ID': totalZero, 'Full Name': '', 'Status': '', 'Boarding House': '', 'Room': '', 'Enrollment ID': '', 'Balance': 0, 'Balance Status': '', 'Absolute Balance': '', 'Currency': '', 'Last Updated': '' });
    excelData.push({});
    excelData.push({ 'ID': 'Net Balance', 'Student ID': '', 'Full Name': '', 'Status': '', 'Boarding House': '', 'Room': '', 'Enrollment ID': '', 'Balance': sumPrepayments - sumDebtors, 'Balance Status': '', 'Absolute Balance': '', 'Currency': '', 'Last Updated': '' });

    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    ws['!cols'] = [
      { wch: 8 },  // ID
      { wch: 15 }, // Student ID
      { wch: 30 }, // Full Name
      { wch: 10 }, // Status
      { wch: 20 }, // Boarding House
      { wch: 15 }, // Room
      { wch: 15 }, // Enrollment ID
      { wch: 12 }, // Balance
      { wch: 15 }, // Balance Status
      { wch: 15 }, // Absolute Balance
      { wch: 10 }, // Currency
      { wch: 15 }  // Last Updated
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Students with Balances');

    // Write to file
    const filename = `students_with_balances_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);

    console.log('✅ Excel file created successfully!');
    console.log(`📁 File: ${filename}`);
    console.log('\n📊 Summary:');
    console.log(`Total Students: ${totalStudents}`);
    console.log(`Students Who Owe: ${totalDebtors} (Total: $${sumDebtors.toFixed(2)})`);
    console.log(`Students Who Prepaid: ${totalPrepayments} (Total: $${sumPrepayments.toFixed(2)})`);
    console.log(`Students With Zero Balance: ${totalZero}`);
    console.log(`Net Balance: $${(sumPrepayments - sumDebtors).toFixed(2)}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

exportStudentsWithBalances();
