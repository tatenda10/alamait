const XLSX = require('xlsx');
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'alamait',
  port: process.env.DB_PORT || 3306
};

// Function to read Excel file
function readExcelFile(filePath) {
  try {
    console.log(`Reading Excel file: ${filePath}`);
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON with headers
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1,
      defval: null 
    });
    
    if (jsonData.length < 2) {
      throw new Error('Excel file must have at least a header row and one data row');
    }
    
    // Get headers from first row
    const headers = jsonData[0].map(header => header ? header.toString().trim() : '');
    const rows = jsonData.slice(1);
    
    // Convert to objects
    const data = rows.map((row, index) => {
      const obj = {};
      headers.forEach((header, colIndex) => {
        if (header && row[colIndex] !== undefined && row[colIndex] !== null) {
          obj[header] = row[colIndex];
        }
      });
      return obj;
    }).filter(obj => Object.keys(obj).length > 0); // Remove empty rows
    
    console.log(`Found ${data.length} records with headers:`, headers);
    return data;
  } catch (error) {
    console.error('Error reading Excel file:', error);
    throw error;
  }
}

// Function to convert Excel date to JavaScript date
function convertExcelDate(excelDate) {
  if (typeof excelDate === 'number') {
    // Excel date is number of days since 1900-01-01
    const excelEpoch = new Date(1900, 0, 1);
    const date = new Date(excelEpoch.getTime() + (excelDate - 2) * 24 * 60 * 60 * 1000);
    return date;
  } else if (typeof excelDate === 'string') {
    // Try to parse as date string
    const date = new Date(excelDate);
    if (!isNaN(date.getTime())) {
      return date;
    }
    // Try DD/MM/YYYY format
    const parts = excelDate.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1; // Month is 0-indexed
      let year = parseInt(parts[2]);
      
      // Handle 2-digit years and fix the specific case in the Excel file
      if (year < 100) {
        year += 2000; // Assume 20xx for 2-digit years
      } else if (year < 1000) {
        // Handle cases like "205" which should be "2025"
        year += 2000;
      }
      
      const convertedDate = new Date(year, month, day);
      console.log(`Converted date: ${excelDate} -> ${convertedDate.toISOString().split('T')[0]}`);
      return convertedDate;
    }
  }
  return null;
}

// Function to find student by name
async function findStudentByName(connection, studentName, boardingHouseId) {
  try {
    // Try exact match first
    let [rows] = await connection.execute(
      `SELECT id, full_name, boarding_house_id 
       FROM students 
       WHERE full_name = ? AND boarding_house_id = ? AND deleted_at IS NULL`,
      [studentName, boardingHouseId]
    );
    
    if (rows.length === 0) {
      // Try partial match
      [rows] = await connection.execute(
        `SELECT id, full_name, boarding_house_id 
         FROM students 
         WHERE full_name LIKE ? AND boarding_house_id = ? AND deleted_at IS NULL`,
        [`%${studentName}%`, boardingHouseId]
      );
    }
    
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Error finding student:', error);
    return null;
  }
}

// Function to create payment schedules
async function createPaymentSchedules(connection, studentId, enrollmentId, leaseStartDate, leaseEndDate, monthlyRent) {
  try {
    const startDate = new Date(leaseStartDate);
    const endDate = new Date(leaseEndDate);
    const schedules = [];
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error(`Invalid date format: start=${leaseStartDate}, end=${leaseEndDate}`);
    }
    
    console.log(`Creating schedules from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
    
    let currentDate = new Date(startDate);
    let periodNumber = 1;
    
    while (currentDate <= endDate) {
      const periodStartDate = new Date(currentDate);
      const periodEndDate = new Date(currentDate);
      periodEndDate.setMonth(periodEndDate.getMonth() + 1);
      periodEndDate.setDate(periodEndDate.getDate() - 1);
      
      // Don't create schedules beyond the lease end date
      if (periodEndDate > endDate) {
        periodEndDate.setTime(endDate.getTime());
      }
      
      console.log(`Creating schedule ${periodNumber}: ${periodStartDate.toISOString().split('T')[0]} to ${periodEndDate.toISOString().split('T')[0]}`);
      
      const [result] = await connection.execute(
        `INSERT INTO student_payment_schedules (
          enrollment_id, student_id, period_start_date, period_end_date, 
          amount_due, currency, status, created_at
        ) VALUES (?, ?, ?, ?, ?, 'USD', 'pending', NOW())`,
        [enrollmentId, studentId, periodStartDate, periodEndDate, monthlyRent]
      );
      
      const schedule = {
        id: result.insertId,
        period_start_date: periodStartDate,
        period_end_date: periodEndDate,
        amount_due: monthlyRent,
        period_number: periodNumber
      };
      
      schedules.push(schedule);
      
      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1);
      periodNumber++;
    }
    
    return schedules;
  } catch (error) {
    console.error('Error creating payment schedules:', error);
    throw error;
  }
}

// Function to create payments for all schedules
async function createPayments(connection, studentId, enrollmentId, schedules, paymentDate) {
  try {
    const payments = [];
    
    for (const schedule of schedules) {
      const referenceNumber = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create payment record
      const [paymentResult] = await connection.execute(
        `INSERT INTO student_payments (
          student_id, enrollment_id, schedule_id, amount, payment_date,
          payment_method, payment_type, status, reference_number, created_at
        ) VALUES (?, ?, ?, ?, ?, 'cash', 'monthly_rent', 'completed', ?, NOW())`,
        [
          studentId, 
          enrollmentId, 
          schedule.id, 
          schedule.amount_due, 
          paymentDate,
          referenceNumber
        ]
      );
      
      // Update schedule status
      await connection.execute(
        `UPDATE student_payment_schedules 
         SET status = 'paid', amount_paid = ? 
         WHERE id = ?`,
        [schedule.amount_due, schedule.id]
      );
      
      payments.push({
        id: paymentResult.insertId,
        schedule_id: schedule.id,
        amount: schedule.amount_due,
        reference_number: referenceNumber
      });
    }
    
    return payments;
  } catch (error) {
    console.error('Error creating payments:', error);
    throw error;
  }
}

// Function to create enrollment if it doesn't exist
async function createEnrollment(connection, studentId, roomId, leaseStartDate, leaseEndDate, monthlyRent, boardingHouseId) {
  try {
    // Check if enrollment already exists
    const [existingEnrollments] = await connection.execute(
      `SELECT id FROM student_enrollments 
       WHERE student_id = ? AND deleted_at IS NULL`,
      [studentId]
    );
    
    if (existingEnrollments.length > 0) {
      console.log(`Using existing enrollment ID: ${existingEnrollments[0].id}`);
      return existingEnrollments[0].id;
    }
    
    // Create new enrollment
    const [result] = await connection.execute(
      `INSERT INTO student_enrollments (
        student_id, room_id, start_date, expected_end_date, 
        agreed_amount, currency, boarding_house_id, created_at
      ) VALUES (?, ?, ?, ?, ?, 'USD', ?, NOW())`,
      [studentId, roomId, leaseStartDate, leaseEndDate, monthlyRent, boardingHouseId]
    );
    
    console.log(`Created new enrollment ID: ${result.insertId}`);
    return result.insertId;
  } catch (error) {
    console.error('Error creating enrollment:', error);
    throw error;
  }
}

// Function to validate and clean data
function validateAndCleanRecord(record) {
  const cleaned = {};
  
  // Map the actual Excel column names to our expected format
  const fieldMappings = {
    'Student Name': ['Tenant name', 'Student Name', 'StudentName', 'Name', 'Full Name', 'Student'],
    'Lease Start Date': ['Lease start date', 'Lease Start Date', 'LeaseStartDate', 'Start Date', 'Lease Start', 'Start'],
    'Lease End Date': ['Lease end date', 'Lease End Date', 'LeaseEndDate', 'End Date', 'Lease End', 'End'],
    'Monthly Rent': ['Monthly rent', 'Monthly Rent', 'MonthlyRent', 'Rent', 'Amount', 'Monthly Amount'],
    'Room Number': ['Room', 'Room Number', 'RoomNumber', 'Room #', 'Room No'],
    'Boarding House ID': ['Boarding House ID', 'BoardingHouseID', 'Boarding House', 'House ID']
  };
  
  // Map fields
  Object.entries(fieldMappings).forEach(([key, variations]) => {
    for (const variation of variations) {
      if (record[variation] !== undefined && record[variation] !== null) {
        cleaned[key] = record[variation];
        break;
      }
    }
  });
  
  return cleaned;
}

// Main function to process July data
async function processJulyData() {
  let connection;
  
  try {
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database');
    
    // Read Excel file
    const excelData = readExcelFile('./july data.xlsx');
    console.log(`Found ${excelData.length} records in Excel file`);
    
    let processedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    // Process each record
    for (const record of excelData) {
      try {
        console.log(`\n--- Processing record ${processedCount + skippedCount + errorCount + 1}/${excelData.length} ---`);
        
        // Validate and clean record
        const cleanedRecord = validateAndCleanRecord(record);
        
        // Extract data
        const studentName = cleanedRecord['Student Name'];
        const leaseStartDateRaw = cleanedRecord['Lease Start Date'];
        const leaseEndDateRaw = cleanedRecord['Lease End Date'];
        const monthlyRent = parseFloat(cleanedRecord['Monthly Rent'] || 0);
        const roomNumber = cleanedRecord['Room Number'];
        const boardingHouseId = 4; // Always set to 4
        
        // Convert dates
        const leaseStartDate = convertExcelDate(leaseStartDateRaw);
        const leaseEndDate = convertExcelDate(leaseEndDateRaw);
        
        // Validate required fields
        if (!studentName || !leaseStartDate || !leaseEndDate || !monthlyRent || !roomNumber) {
          console.log(`❌ Skipping record - missing required data:`, {
            studentName,
            leaseStartDate: leaseStartDateRaw,
            leaseEndDate: leaseEndDateRaw,
            monthlyRent,
            roomNumber
          });
          skippedCount++;
          continue;
        }
        
        console.log(`📋 Record data:`, {
          studentName,
          leaseStartDate: leaseStartDate.toISOString().split('T')[0],
          leaseEndDate: leaseEndDate.toISOString().split('T')[0],
          monthlyRent,
          roomNumber,
          boardingHouseId
        });
        
        // Find student
        const student = await findStudentByName(connection, studentName, boardingHouseId);
        if (!student) {
          console.log(`❌ Student not found: ${studentName} in boarding house ${boardingHouseId}`);
          skippedCount++;
          continue;
        }
        
        console.log(`✅ Found student: ${student.full_name} (ID: ${student.id})`);
        
        // Find room by room number
        const [rooms] = await connection.execute(
          `SELECT id, name FROM rooms WHERE name = ? AND boarding_house_id = ? AND deleted_at IS NULL`,
          [roomNumber, boardingHouseId]
        );
        
        const roomId = rooms.length > 0 ? rooms[0].id : null;
        if (!roomId) {
          console.log(`❌ Room not found: ${roomNumber} in boarding house ${boardingHouseId}`);
          skippedCount++;
          continue;
        }
        
        console.log(`✅ Found room: ${rooms[0].name} (ID: ${roomId})`);
        
        // Create or get enrollment
        const enrollmentId = await createEnrollment(
          connection, 
          student.id, 
          roomId, 
          leaseStartDate, 
          leaseEndDate, 
          monthlyRent, 
          boardingHouseId
        );
        
        // Create payment schedules
        const schedules = await createPaymentSchedules(
          connection,
          student.id,
          enrollmentId,
          leaseStartDate,
          leaseEndDate,
          monthlyRent
        );
        
        console.log(`✅ Created ${schedules.length} payment schedules:`);
        schedules.forEach(schedule => {
          console.log(`   📅 Period ${schedule.period_number}: ${schedule.period_start_date.toISOString().split('T')[0]} to ${schedule.period_end_date.toISOString().split('T')[0]} - $${schedule.amount_due}`);
        });
        
        // Create payments (assuming they paid everything)
        const paymentDate = new Date(leaseStartDate);
        const payments = await createPayments(
          connection,
          student.id,
          enrollmentId,
          schedules,
          paymentDate
        );
        
        console.log(`✅ Created ${payments.length} payments`);
        processedCount++;
        
      } catch (error) {
        console.error(`❌ Error processing record:`, record, error.message);
        errorCount++;
      }
    }
    
    console.log('\n🎉 July data import completed!');
    console.log(`📊 Summary:`);
    console.log(`   ✅ Processed: ${processedCount} records`);
    console.log(`   ⏭️  Skipped: ${skippedCount} records`);
    console.log(`   ❌ Errors: ${errorCount} records`);
    
  } catch (error) {
    console.error('❌ Error processing July data:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the script
if (require.main === module) {
  processJulyData().catch(console.error);
}

module.exports = { processJulyData }; 