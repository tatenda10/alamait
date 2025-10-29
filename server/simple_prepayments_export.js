require('dotenv').config();
const mysql = require('mysql2/promise');
const XLSX = require('xlsx');

async function exportSimplePrepayments() {
  console.log('💰 Creating Simple Prepayments Excel File...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    // Get students with positive balances
    const [students] = await connection.execute(`
      SELECT 
        s.full_name as 'Student Name',
        COALESCE(bh.name, 'N/A') as 'Boarding House',
        COALESCE(r.name, 'N/A') as 'Room',
        sab.current_balance as 'Credit Balance'
      FROM students s
      JOIN student_account_balances sab ON s.id = sab.student_id
      LEFT JOIN student_enrollments se ON s.id = se.student_id AND se.deleted_at IS NULL
      LEFT JOIN rooms r ON se.room_id = r.id
      LEFT JOIN boarding_houses bh ON se.boarding_house_id = bh.id
      WHERE s.deleted_at IS NULL
        AND sab.current_balance > 0
        AND sab.deleted_at IS NULL
      ORDER BY sab.current_balance DESC
    `);

    console.log(`Found ${students.length} students with prepayments\n`);

    // Calculate total
    const total = students.reduce((sum, s) => sum + parseFloat(s['Credit Balance']), 0);

    console.log('Students:');
    students.forEach((s, i) => {
      console.log(`${i + 1}. ${s['Student Name']}: $${s['Credit Balance']} (${s.Room}, ${s['Boarding House']})`);
    });

    // Add blank row and total
    students.push({
      'Student Name': '',
      'Boarding House': '',
      'Room': '',
      'Credit Balance': ''
    });
    students.push({
      'Student Name': 'TOTAL',
      'Boarding House': `${students.length - 1} Students`,
      'Room': '',
      'Credit Balance': total
    });

    // Create workbook
    const ws = XLSX.utils.json_to_sheet(students);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 30 }, // Student Name
      { wch: 20 }, // Boarding House
      { wch: 15 }, // Room
      { wch: 15 }  // Credit Balance
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Prepayments');

    // Write file with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `STUDENT_PREPAYMENTS_${timestamp}.xlsx`;
    XLSX.writeFile(wb, filename);

    console.log(`\n✅ Excel file created: ${filename}`);
    console.log(`📊 Total: $${total.toFixed(2)}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

exportSimplePrepayments();

