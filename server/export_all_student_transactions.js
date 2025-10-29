require('dotenv').config();
const mysql = require('mysql2/promise');
const XLSX = require('xlsx');

async function exportStudentTransactions() {
  console.log('💰 Exporting Student Transactions...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    // Get all transactions for students
    const [transactions] = await connection.execute(`
      SELECT 
        s.id as student_db_id,
        s.student_id,
        s.full_name,
        bh.name as boarding_house,
        r.name as room_name,
        t.id as transaction_id,
        t.transaction_type,
        t.transaction_date,
        t.amount,
        t.currency,
        t.reference,
        t.description,
        t.status,
        t.created_at
      FROM transactions t
      JOIN students s ON t.student_id = s.id
      LEFT JOIN student_enrollments se ON t.student_id = se.student_id AND se.deleted_at IS NULL
      LEFT JOIN boarding_houses bh ON t.boarding_house_id = bh.id
      LEFT JOIN rooms r ON se.room_id = r.id
      WHERE t.deleted_at IS NULL
        AND s.deleted_at IS NULL
      ORDER BY s.full_name, t.transaction_date DESC
    `);

    console.log(`✅ Found ${transactions.length} transactions\n`);

    // Prepare data for Excel
    const excelData = transactions.map(txn => ({
      'Student DB ID': txn.student_db_id,
      'Student ID': txn.student_id,
      'Student Name': txn.full_name,
      'Boarding House': txn.boarding_house || 'Not Assigned',
      'Room': txn.room_name || 'Not Assigned',
      'Transaction ID': txn.transaction_id,
      'Type': txn.transaction_type || 'N/A',
      'Transaction Date': txn.transaction_date ? new Date(txn.transaction_date).toLocaleDateString('en-GB') : 'N/A',
      'Amount': parseFloat(txn.amount),
      'Currency': txn.currency || 'USD',
      'Reference': txn.reference || 'N/A',
      'Description': txn.description || '',
      'Status': txn.status || 'N/A',
      'Created At': txn.created_at ? new Date(txn.created_at).toLocaleString('en-GB') : 'N/A'
    }));

    // Calculate summary
    const uniqueStudents = [...new Set(transactions.map(t => t.student_id))].length;
    const totalTransactions = transactions.length;
    const totalAmount = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);

    // Group by student
    const studentSummary = {};
    transactions.forEach(txn => {
      const key = txn.student_id;
      if (!studentSummary[key]) {
        studentSummary[key] = {
          name: txn.full_name,
          count: 0,
          total: 0
        };
      }
      studentSummary[key].count += 1;
      studentSummary[key].total += parseFloat(txn.amount);
    });

    // Add summary rows
    excelData.push({});
    excelData.push({ 'Student DB ID': 'SUMMARY', 'Student ID': '', 'Student Name': '', 'Boarding House': '', 'Room': '', 'Transaction ID': '', 'Type': '', 'Transaction Date': '', 'Amount': '', 'Currency': '', 'Reference': '', 'Description': '', 'Status': '', 'Created At': '' });
    excelData.push({});
    excelData.push({ 'Student DB ID': 'Total Students', 'Student ID': uniqueStudents, 'Student Name': '', 'Boarding House': '', 'Room': '', 'Transaction ID': '', 'Type': '', 'Transaction Date': '', 'Amount': '', 'Currency': '', 'Reference': '', 'Description': '', 'Status': '', 'Created At': '' });
    excelData.push({ 'Student DB ID': 'Total Transactions', 'Student ID': totalTransactions, 'Student Name': '', 'Boarding House': '', 'Room': '', 'Transaction ID': '', 'Type': '', 'Transaction Date': '', 'Amount': '', 'Currency': '', 'Reference': '', 'Description': '', 'Status': '', 'Created At': '' });
    excelData.push({ 'Student DB ID': 'Total Amount', 'Student ID': '', 'Student Name': '', 'Boarding House': '', 'Room': '', 'Transaction ID': '', 'Type': '', 'Transaction Date': '', 'Amount': totalAmount, 'Currency': 'USD', 'Reference': '', 'Description': '', 'Status': '', 'Created At': '' });

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
      { wch: 15 }, // Transaction ID
      { wch: 15 }, // Type
      { wch: 15 }, // Transaction Date
      { wch: 12 }, // Amount
      { wch: 10 }, // Currency
      { wch: 20 }, // Reference
      { wch: 40 }, // Description
      { wch: 12 }, // Status
      { wch: 18 }  // Created At
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Student Transactions');

    // Create second sheet with student summary
    const summaryData = Object.entries(studentSummary)
      .map(([studentId, data]) => ({
        'Student ID': studentId,
        'Student Name': data.name,
        'Number of Transactions': data.count,
        'Total Amount': data.total.toFixed(2)
      }))
      .sort((a, b) => b['Total Amount'] - a['Total Amount']);

    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    wsSummary['!cols'] = [
      { wch: 15 }, // Student ID
      { wch: 30 }, // Student Name
      { wch: 20 }, // Number of Transactions
      { wch: 18 }  // Total Amount
    ];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary by Student');

    // Write to file
    const filename = `student_transactions_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);

    console.log('✅ Excel file created successfully!');
    console.log(`📁 File: ${filename}`);
    console.log('\n📊 Summary:');
    console.log(`Total Students: ${uniqueStudents}`);
    console.log(`Total Transactions: ${totalTransactions}`);
    console.log(`Total Amount: $${totalAmount.toFixed(2)}`);
    console.log(`\n📄 Sheets created:`);
    console.log(`  1. Student Transactions - All transaction details`);
    console.log(`  2. Summary by Student - Summary per student`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

exportStudentTransactions();

