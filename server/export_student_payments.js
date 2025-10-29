require('dotenv').config();
const mysql = require('mysql2/promise');
const XLSX = require('xlsx');

async function exportStudentPayments() {
  console.log('💰 Exporting Student Payments...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    // Get all payments with student information
    const [payments] = await connection.execute(`
      SELECT 
        s.id as student_db_id,
        s.student_id,
        s.full_name,
        bh.name as boarding_house,
        r.name as room_name,
        sp.id as payment_id,
        sp.payment_date,
        sp.amount,
        'USD' as currency,
        sp.payment_method,
        sp.reference_number,
        sp.notes,
        sp.created_at
      FROM student_payments sp
      JOIN students s ON sp.student_id = s.id
      LEFT JOIN student_enrollments se ON sp.enrollment_id = se.id AND se.deleted_at IS NULL
      LEFT JOIN boarding_houses bh ON se.boarding_house_id = bh.id
      LEFT JOIN rooms r ON se.room_id = r.id
      WHERE sp.deleted_at IS NULL
        AND s.deleted_at IS NULL
      ORDER BY s.full_name, sp.payment_date DESC
    `);

    console.log(`✅ Found ${payments.length} payments\n`);

    // Prepare data for Excel
    const excelData = payments.map(payment => ({
      'Student DB ID': payment.student_db_id,
      'Student ID': payment.student_id,
      'Student Name': payment.full_name,
      'Boarding House': payment.boarding_house || 'Not Assigned',
      'Room': payment.room_name || 'Not Assigned',
      'Payment ID': payment.payment_id,
      'Payment Date': payment.payment_date ? new Date(payment.payment_date).toLocaleDateString('en-GB') : 'N/A',
      'Amount': parseFloat(payment.amount),
      'Currency': payment.currency || 'USD',
      'Payment Method': payment.payment_method || 'N/A',
      'Receipt Number': payment.reference_number || 'N/A',
      'Notes': payment.notes || '',
      'Created At': payment.created_at ? new Date(payment.created_at).toLocaleString('en-GB') : 'N/A'
    }));

    // Calculate summary
    const uniqueStudents = [...new Set(payments.map(p => p.student_id))].length;
    const totalPayments = payments.length;
    const totalAmount = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

    // Group by student
    const studentSummary = {};
    payments.forEach(payment => {
      const key = payment.student_id;
      if (!studentSummary[key]) {
        studentSummary[key] = {
          name: payment.full_name,
          count: 0,
          total: 0
        };
      }
      studentSummary[key].count += 1;
      studentSummary[key].total += parseFloat(payment.amount);
    });

    // Add summary rows
    excelData.push({});
    excelData.push({ 'Student DB ID': 'SUMMARY', 'Student ID': '', 'Student Name': '', 'Boarding House': '', 'Room': '', 'Payment ID': '', 'Payment Date': '', 'Amount': '', 'Currency': '', 'Payment Method': '', 'Receipt Number': '', 'Notes': '', 'Created At': '' });
    excelData.push({});
    excelData.push({ 'Student DB ID': 'Total Students with Payments', 'Student ID': uniqueStudents, 'Student Name': '', 'Boarding House': '', 'Room': '', 'Payment ID': '', 'Payment Date': '', 'Amount': '', 'Currency': '', 'Payment Method': '', 'Receipt Number': '', 'Notes': '', 'Created At': '' });
    excelData.push({ 'Student DB ID': 'Total Number of Payments', 'Student ID': totalPayments, 'Student Name': '', 'Boarding House': '', 'Room': '', 'Payment ID': '', 'Payment Date': '', 'Amount': '', 'Currency': '', 'Payment Method': '', 'Receipt Number': '', 'Notes': '', 'Created At': '' });
    excelData.push({ 'Student DB ID': 'Total Amount Paid', 'Student ID': '', 'Student Name': '', 'Boarding House': '', 'Room': '', 'Payment ID': '', 'Payment Date': '', 'Amount': totalAmount, 'Currency': 'USD', 'Payment Method': '', 'Receipt Number': '', 'Notes': '', 'Created At': '' });

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
      { wch: 12 }, // Payment ID
      { wch: 15 }, // Payment Date
      { wch: 12 }, // Amount
      { wch: 10 }, // Currency
      { wch: 15 }, // Payment Method
      { wch: 15 }, // Receipt Number
      { wch: 30 }, // Notes
      { wch: 18 }  // Created At
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Student Payments');

    // Create second sheet with student summary
    const summaryData = Object.entries(studentSummary)
      .map(([studentId, data]) => ({
        'Student ID': studentId,
        'Student Name': data.name,
        'Number of Payments': data.count,
        'Total Amount Paid': data.total.toFixed(2)
      }))
      .sort((a, b) => b['Total Amount Paid'] - a['Total Amount Paid']);

    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    wsSummary['!cols'] = [
      { wch: 15 }, // Student ID
      { wch: 30 }, // Student Name
      { wch: 18 }, // Number of Payments
      { wch: 18 }  // Total Amount Paid
    ];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Payment Summary by Student');

    // Write to file
    const filename = `student_payments_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);

    console.log('✅ Excel file created successfully!');
    console.log(`📁 File: ${filename}`);
    console.log('\n📊 Summary:');
    console.log(`Total Students with Payments: ${uniqueStudents}`);
    console.log(`Total Number of Payments: ${totalPayments}`);
    console.log(`Total Amount Paid: $${totalAmount.toFixed(2)}`);
    console.log(`\n📄 Sheets created:`);
    console.log(`  1. Student Payments - All payment details`);
    console.log(`  2. Payment Summary by Student - Summary per student`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

exportStudentPayments();

