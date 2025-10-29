require('dotenv').config();
const mysql = require('mysql2/promise');
const XLSX = require('xlsx');

async function fixAndExport() {
  console.log('🔧 Fixing Enrollments and Exporting Prepayments...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    await connection.beginTransaction();

    // ============================================
    // PART 1: Fix Bellis Mapetere
    // ============================================
    console.log('1️⃣ Fixing Bellis Mapetere...\n');
    
    const [bellisStudents] = await connection.execute(`
      SELECT s.id, s.student_id, s.full_name
      FROM students s
      WHERE s.full_name LIKE '%Bellis%Mapetere%' 
        AND s.deleted_at IS NULL
    `);

    if (bellisStudents.length > 0) {
      const bellis = bellisStudents[0];
      console.log(`   Found: ${bellis.full_name} (ID: ${bellis.id})`);

      // Get M1 room in St Kilda
      const [m1Room] = await connection.execute(`
        SELECT r.id, r.name, bh.name as boarding_house
        FROM rooms r
        JOIN boarding_houses bh ON r.boarding_house_id = bh.id
        WHERE r.name = 'M1' 
          AND bh.name = 'St Kilda'
          AND r.deleted_at IS NULL
      `);

      if (m1Room.length > 0) {
        console.log(`   Found room: ${m1Room[0].name} in ${m1Room[0].boarding_house}`);

        // Restore enrollment 137 (undelete it)
        await connection.execute(`
          UPDATE student_enrollments 
          SET deleted_at = NULL
          WHERE id = 137 AND student_id = ?
        `, [bellis.id]);

        console.log('   ✓ Restored enrollment 137');

        // Set balance to 0
        await connection.execute(`
          UPDATE student_account_balances 
          SET current_balance = 0,
              updated_at = NOW()
          WHERE student_id = ? AND enrollment_id = 137
        `, [bellis.id]);

        console.log('   ✓ Set balance to $0.00');
        console.log('✅ Bellis Mapetere fixed: M1, St Kilda, Balance: $0.00\n');
      }
    }

    // ============================================
    // PART 2: Fix Christine Mutsikwa
    // ============================================
    console.log('2️⃣ Fixing Christine Mutsikwa...\n');
    
    const [christineStudents] = await connection.execute(`
      SELECT s.id, s.student_id, s.full_name
      FROM students s
      WHERE s.full_name LIKE '%Christine%Mutsikwa%' 
        AND s.deleted_at IS NULL
    `);

    if (christineStudents.length > 0) {
      const christine = christineStudents[0];
      console.log(`   Found: ${christine.full_name} (ID: ${christine.id})`);

      // Get BUS1 room in St Kilda
      const [bus1Room] = await connection.execute(`
        SELECT r.id, r.name, bh.name as boarding_house
        FROM rooms r
        JOIN boarding_houses bh ON r.boarding_house_id = bh.id
        WHERE r.name = 'BUS1' 
          AND bh.name = 'St Kilda'
          AND r.deleted_at IS NULL
      `);

      if (bus1Room.length > 0) {
        console.log(`   Found room: ${bus1Room[0].name} in ${bus1Room[0].boarding_house}`);

        // Restore enrollment 140 (undelete it)
        await connection.execute(`
          UPDATE student_enrollments 
          SET deleted_at = NULL
          WHERE id = 140 AND student_id = ?
        `, [christine.id]);

        console.log('   ✓ Restored enrollment 140');

        // Ensure balance exists (it was already 0)
        await connection.execute(`
          INSERT INTO student_account_balances 
            (student_id, enrollment_id, current_balance, currency, created_at, updated_at)
          VALUES (?, 140, 0, 'USD', NOW(), NOW())
          ON DUPLICATE KEY UPDATE 
            current_balance = 0,
            updated_at = NOW()
        `, [christine.id]);

        console.log('   ✓ Set balance to $0.00');
        console.log('✅ Christine Mutsikwa fixed: BUS1, St Kilda, Balance: $0.00\n');
      }
    }

    await connection.commit();

    // ============================================
    // PART 3: Export Prepayments to Excel
    // ============================================
    console.log('3️⃣ Exporting Student Prepayments...\n');

    const [prepayments] = await connection.execute(`
      SELECT 
        s.id as student_db_id,
        s.student_id,
        s.full_name as student_name,
        bh.name as boarding_house,
        r.name as room_name,
        sab.current_balance as credit_balance,
        sab.currency,
        sab.updated_at as last_updated,
        s.status
      FROM students s
      JOIN student_enrollments se ON s.id = se.student_id
      JOIN rooms r ON se.room_id = r.id
      JOIN boarding_houses bh ON se.boarding_house_id = bh.id
      JOIN student_account_balances sab ON s.id = sab.student_id AND se.id = sab.enrollment_id
      WHERE s.deleted_at IS NULL
        AND se.deleted_at IS NULL
        AND (s.status = 'Active' OR s.status IS NULL)
        AND (se.expected_end_date IS NULL OR se.expected_end_date >= CURRENT_DATE)
        AND sab.current_balance > 0
        AND sab.deleted_at IS NULL
      ORDER BY sab.current_balance DESC, s.full_name
    `);

    console.log(`   Found ${prepayments.length} students with prepayments\n`);

    // Prepare Excel data
    const excelData = prepayments.map(student => ({
      'Student DB ID': student.student_db_id,
      'Student ID': student.student_id,
      'Student Name': student.student_name,
      'Boarding House': student.boarding_house,
      'Room': student.room_name,
      'Credit Balance': parseFloat(student.credit_balance).toFixed(2),
      'Currency': student.currency || 'USD',
      'Status': student.status || 'Active',
      'Last Updated': student.last_updated ? new Date(student.last_updated).toLocaleDateString('en-GB') : 'N/A'
    }));

    // Calculate totals
    const totalPrepayments = prepayments.reduce((sum, s) => sum + parseFloat(s.credit_balance), 0);

    // Add summary rows
    excelData.push({});
    excelData.push({
      'Student DB ID': 'SUMMARY',
      'Student ID': '',
      'Student Name': '',
      'Boarding House': '',
      'Room': '',
      'Credit Balance': '',
      'Currency': '',
      'Status': '',
      'Last Updated': ''
    });
    excelData.push({});
    excelData.push({
      'Student DB ID': 'Total Students',
      'Student ID': prepayments.length,
      'Student Name': '',
      'Boarding House': '',
      'Room': '',
      'Credit Balance': '',
      'Currency': '',
      'Status': '',
      'Last Updated': ''
    });
    excelData.push({
      'Student DB ID': 'Total Prepayments',
      'Student ID': '',
      'Student Name': '',
      'Boarding House': '',
      'Room': '',
      'Credit Balance': totalPrepayments.toFixed(2),
      'Currency': 'USD',
      'Status': '',
      'Last Updated': ''
    });

    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    ws['!cols'] = [
      { wch: 15 }, // Student DB ID
      { wch: 15 }, // Student ID
      { wch: 30 }, // Student Name
      { wch: 20 }, // Boarding House
      { wch: 15 }, // Room
      { wch: 15 }, // Credit Balance
      { wch: 10 }, // Currency
      { wch: 12 }, // Status
      { wch: 15 }  // Last Updated
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Student Prepayments');

    // Write to file
    const filename = `student_prepayments_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);

    console.log('✅ Excel file created successfully!');
    console.log(`📁 File: ${filename}`);
    console.log(`\n📊 Summary:`);
    console.log(`   Total Students with Prepayments: ${prepayments.length}`);
    console.log(`   Total Prepayments Amount: $${totalPrepayments.toFixed(2)}`);

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

fixAndExport().catch(console.error);

