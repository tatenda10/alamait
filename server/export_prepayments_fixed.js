require('dotenv').config();
const mysql = require('mysql2/promise');
const XLSX = require('xlsx');

async function exportPrepayments() {
  console.log('💰 Exporting Student Prepayments...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    // Simplified query - just get students with positive balances and their current enrollments
    const [prepayments] = await connection.execute(`
      SELECT 
        s.id as student_db_id,
        s.student_id,
        s.full_name as student_name,
        COALESCE(bh.name, 'N/A') as boarding_house,
        COALESCE(r.name, 'N/A') as room_name,
        MAX(sab.current_balance) as credit_balance,
        COALESCE(MAX(sab.currency), 'USD') as currency,
        s.status
      FROM students s
      JOIN student_account_balances sab ON s.id = sab.student_id
      LEFT JOIN student_enrollments se ON s.id = se.student_id AND se.deleted_at IS NULL
      LEFT JOIN rooms r ON se.room_id = r.id
      LEFT JOIN boarding_houses bh ON se.boarding_house_id = bh.id
      WHERE s.deleted_at IS NULL
        AND sab.current_balance > 0
        AND sab.deleted_at IS NULL
        AND (s.status = 'Active' OR s.status IS NULL)
      GROUP BY s.id, s.student_id, s.full_name, bh.name, r.name, s.status
      ORDER BY credit_balance DESC, s.full_name
    `);

    console.log(`✅ Found ${prepayments.length} students with prepayments\n`);

    if (prepayments.length === 0) {
      console.log('⚠️ No prepayments found!');
      return;
    }

    // Prepare Excel data
    const excelData = prepayments.map((student, index) => ({
      '#': index + 1,
      'Student DB ID': student.student_db_id,
      'Student ID': student.student_id,
      'Student Name': student.student_name,
      'Boarding House': student.boarding_house,
      'Room': student.room_name,
      'Credit Balance': parseFloat(student.credit_balance).toFixed(2),
      'Currency': student.currency,
      'Status': student.status || 'Active'
    }));

    // Calculate totals
    const totalPrepayments = prepayments.reduce((sum, s) => sum + parseFloat(s.credit_balance), 0);

    console.log('📋 Sample prepayments:');
    prepayments.slice(0, 10).forEach((s, i) => {
      console.log(`  ${i + 1}. ${s.student_name}: $${parseFloat(s.credit_balance).toFixed(2)} (${s.room_name}, ${s.boarding_house})`);
    });
    if (prepayments.length > 10) {
      console.log(`  ... and ${prepayments.length - 10} more\n`);
    }

    // Add summary rows
    excelData.push({});
    excelData.push({
      '#': '',
      'Student DB ID': 'SUMMARY',
      'Student ID': '',
      'Student Name': '',
      'Boarding House': '',
      'Room': '',
      'Credit Balance': '',
      'Currency': '',
      'Status': ''
    });
    excelData.push({});
    excelData.push({
      '#': '',
      'Student DB ID': 'Total Students with Prepayments',
      'Student ID': prepayments.length,
      'Student Name': '',
      'Boarding House': '',
      'Room': '',
      'Credit Balance': '',
      'Currency': '',
      'Status': ''
    });
    excelData.push({
      '#': '',
      'Student DB ID': 'Total Prepayments Amount',
      'Student ID': '',
      'Student Name': '',
      'Boarding House': '',
      'Room': '',
      'Credit Balance': totalPrepayments.toFixed(2),
      'Currency': 'USD',
      'Status': ''
    });

    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    ws['!cols'] = [
      { wch: 5 },  // #
      { wch: 15 }, // Student DB ID
      { wch: 15 }, // Student ID
      { wch: 30 }, // Student Name
      { wch: 20 }, // Boarding House
      { wch: 15 }, // Room
      { wch: 15 }, // Credit Balance
      { wch: 10 }, // Currency
      { wch: 12 }  // Status
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Student Prepayments');

    // Write to file
    const filename = `student_prepayments_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);

    console.log('\n✅ Excel file created successfully!');
    console.log(`📁 File: ${filename}`);
    console.log(`\n📊 Summary:`);
    console.log(`   Total Students with Prepayments: ${prepayments.length}`);
    console.log(`   Total Prepayments Amount: $${totalPrepayments.toFixed(2)}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

exportPrepayments().catch(console.error);

