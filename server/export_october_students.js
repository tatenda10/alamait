const mysql = require('mysql2/promise');
const ExcelJS = require('exceljs');
require('dotenv').config();

async function exportStudentRoomList() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('Fetching student data...');
    
    const [students] = await connection.query(`
      SELECT 
        s.full_name, 
        r.name as room_name, 
        bh.name as boarding_house, 
        se.agreed_amount as rent
      FROM student_enrollments se
      JOIN students s ON se.student_id = s.id
      JOIN rooms r ON se.room_id = r.id
      JOIN boarding_houses bh ON se.boarding_house_id = bh.id
      WHERE se.deleted_at IS NULL
        AND s.status = ?
        AND se.start_date <= LAST_DAY(?)
        AND (se.expected_end_date IS NULL OR se.expected_end_date >= ?)
        AND s.full_name NOT IN (?, ?)
      ORDER BY s.full_name
    `, ['Active', '2025-10-01', '2025-10-01', 'Leona Dengu', 'Shelter Masosonere']);

    console.log(`Found ${students.length} active students`);
    console.log('Creating Excel workbook...');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Active Students - October 2025');

    // Define columns
    worksheet.columns = [
      { header: 'Student Name', key: 'full_name', width: 30 },
      { header: 'Room', key: 'room_name', width: 15 },
      { header: 'Boarding House', key: 'boarding_house', width: 20 },
      { header: 'Monthly Rent', key: 'rent', width: 15 }
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Add student data
    students.forEach(student => {
      worksheet.addRow({
        full_name: student.full_name,
        room_name: student.room_name,
        boarding_house: student.boarding_house,
        rent: parseFloat(student.rent)
      });
    });

    // Add total row
    const totalRent = students.reduce((sum, s) => sum + parseFloat(s.rent), 0);
    const totalRow = worksheet.addRow({
      full_name: '',
      room_name: '',
      boarding_house: 'TOTAL MONTHLY RENT:',
      rent: totalRent
    });

    // Style total row
    totalRow.font = { bold: true };
    totalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE7E6E6' }
    };
    totalRow.getCell('boarding_house').alignment = { horizontal: 'right' };

    // Format rent column as currency
    worksheet.getColumn('rent').numFmt = '"$"#,##0.00';

    // Add borders
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    const filename = 'Active_Students_October_2025.xlsx';
    await workbook.xlsx.writeFile(filename);

    console.log('\n✅ Excel file created successfully!');
    console.log(`📁 File: ${filename}`);
    console.log(`👥 Total students: ${students.length}`);
    console.log(`💰 Total monthly rent: $${totalRent.toFixed(2)}`);

    await connection.end();
  } catch (error) {
    console.error('Error:', error);
    await connection.end();
    process.exit(1);
  }
}

exportStudentRoomList();


