const mysql = require('mysql2/promise');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password123',
  database: process.env.DB_NAME || 'alamait_db',
  port: process.env.DB_PORT || 3306
};

// Student data from your ledger
const studentData = [
  { room: 'Ext 2', name: 'Anita Gwenda', rent: 160.00, adminFee: 20.00, paid: 200.00, balance: 20.00, advance: null },
  { room: 'M4', name: 'Lillian Chatikobo', rent: 180.00, adminFee: 20.00, paid: 180.00, balance: 20.00, advance: null },
  { room: 'M7', name: 'Sharon Matanha', rent: 98.00, adminFee: 20.00, paid: 298.00, balance: null, advance: null },
  { room: 'M1', name: 'Bellis Mapetere', rent: 180.00, adminFee: 20.00, paid: 180.00, balance: 20.00, advance: null },
  { room: 'EXT 1', name: 'Tatenda Kamatando', rent: 160.00, adminFee: 20.00, paid: 50.00, balance: 130.00, advance: 180.00 },
  { room: 'M8', name: 'Fay Mubaiwa', rent: 160.00, adminFee: 20.00, paid: 170.00, balance: 10.00, advance: null },
  { room: 'Bus 2', name: 'Tanyaradzwa Manife', rent: 160.00, adminFee: 20.00, paid: 50.00, balance: 130.00, advance: null },
  { room: 'Bus 1', name: 'Christine Mutsikwa', rent: 160.00, adminFee: 20.00, paid: 180.00, balance: null, advance: null },
  { room: 'Bus 2', name: 'Bertha Mwangu', rent: 160.00, adminFee: 20.00, paid: 50.00, balance: 130.00, advance: null },
  { room: 'M5', name: 'Merrylin Makunzva', rent: 160.00, adminFee: 20.00, paid: 50.00, balance: 130.00, advance: null },
  { room: 'M5', name: 'Shantell Mawarira', rent: 180.00, adminFee: 20.00, paid: 50.00, balance: 150.00, advance: null },
  { room: 'M8', name: 'Salina Saidi', rent: 170.00, adminFee: 20.00, paid: 40.00, balance: 150.00, advance: null },
  { room: 'M2', name: 'Tinotenda Bwangangwanyo', rent: 170.00, adminFee: 20.00, paid: 80.00, balance: 110.00, advance: null },
  { room: 'M2', name: 'Kimberly Nkomo', rent: 170.00, adminFee: 20.00, paid: 100.00, balance: 90.00, advance: null },
  { room: 'M4', name: 'Kimberly Mutowembwa', rent: 180.00, adminFee: 20.00, paid: 200.00, balance: null, advance: null },
  { room: 'M6', name: 'Alicia Matamuko', rent: 180.00, adminFee: 20.00, paid: 50.00, balance: 150.00, advance: null },
  { room: 'M7', name: 'L Moyo', rent: 180.00, adminFee: 20.00, paid: 52.00, balance: 148.00, advance: null }
];

// Room mapping to existing database IDs (Boarding House 4)
const roomMapping = {
  'Ext 2': 15,    // EXT2
  'M4': 11,       // M4
  'M7': 17,       // M7
  'M1': 23,       // M1
  'EXT 1': 16,    // EXT1
  'M8': 20,       // M8
  'Bus 2': 9,     // BUS2
  'Bus 1': 10,    // BUS1
  'M5': 8,        // M5
  'M2': 19,       // M2
  'M6': 14        // M6
};

// Enrollment period: September 1 to December 1, 2024
const enrollmentStartDate = '2024-09-01';
const enrollmentEndDate = '2024-12-01';

// Payment dates in August 2024
const paymentDates = {
  adminFee: '2024-08-15',      // Admin fees paid in mid-August
  firstRent: '2024-08-20',     // First month rent paid in late August
  advance: '2024-08-25'        // Advance payments made in late August
};

async function bulkRegisterStudents() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log('🚀 Starting bulk student registration...');
    console.log(`📅 Enrollment Period: ${enrollmentStartDate} to ${enrollmentEndDate}`);
    console.log(`👥 Total Students: ${studentData.length}`);
    
    await connection.beginTransaction();
    
    // Use Boarding House 4 as specified
    const boardingHouseId = 4;
    console.log(`🏠 Using Boarding House ID: ${boardingHouseId}`);
    
    // Verify boarding house exists
    const [boardingHouses] = await connection.query(
      'SELECT id, name FROM boarding_houses WHERE id = ? AND deleted_at IS NULL',
      [boardingHouseId]
    );
    
    if (boardingHouses.length === 0) {
      throw new Error(`Boarding House ${boardingHouseId} not found.`);
    }
    
    console.log(`🏠 Using Boarding House: ${boardingHouses[0].name} (ID: ${boardingHouseId})`);
    
    // Verify all required rooms exist
    console.log('\n🏠 Verifying Required Rooms...');
    const uniqueRooms = [...new Set(studentData.map(s => s.room))];
    const missingRooms = [];
    
    for (const roomName of uniqueRooms) {
      const roomId = roomMapping[roomName];
      if (!roomId) {
        missingRooms.push(roomName);
        console.log(`❌ Room mapping missing for: ${roomName}`);
      } else {
        // Verify room exists in database
        const [existingRooms] = await connection.query(
          'SELECT id, name, available_beds FROM rooms WHERE id = ? AND boarding_house_id = ? AND deleted_at IS NULL',
          [roomId, boardingHouseId]
        );
        
        if (existingRooms.length === 0) {
          missingRooms.push(roomName);
          console.log(`❌ Room ${roomName} (ID: ${roomId}) not found in database`);
        } else {
          console.log(`✅ Room ${roomName} (ID: ${roomId}) - Available beds: ${existingRooms[0].available_beds}`);
        }
      }
    }
    
    if (missingRooms.length > 0) {
      throw new Error(`Missing rooms: ${missingRooms.join(', ')}. Please create these rooms first.`);
    }
    
    console.log('\n👥 Registering Students...');
    const registeredStudents = [];
    
    for (let i = 0; i < studentData.length; i++) {
      const student = studentData[i];
      const roomId = roomMapping[student.room];
      
      console.log(`\n📝 Processing ${i + 1}/17: ${student.name} (Room: ${student.room} → ID: ${roomId})`);
      
      // 1. Create student record
      const [studentResult] = await connection.query(
        `INSERT INTO students (
          full_name, national_id, university, gender, address, phone_number, 
          boarding_house_id, joined_at, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          student.name,
          `ID${String(i + 1).padStart(3, '0')}`, // Generate ID
          'University of Zimbabwe', // Default university
          'Female', // Default gender
          'Harare, Zimbabwe', // Default address
          `+263${String(Math.floor(Math.random() * 900000000) + 100000000)}`, // Random phone
          boardingHouseId,
          enrollmentStartDate,
          'Active'
        ]
      );
      
      const studentId = studentResult.insertId;
      console.log(`   ✅ Student created (ID: ${studentId})`);
      
      // 2. Create enrollment
      const [enrollmentResult] = await connection.query(
        `INSERT INTO student_enrollments (
          student_id, room_id, start_date, expected_end_date, 
          agreed_amount, admin_fee, security_deposit, currency, 
          boarding_house_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          studentId,
          roomId,
          enrollmentStartDate,
          enrollmentEndDate,
          student.rent,
          student.adminFee,
          0, // No security deposit in your data
          'USD',
          boardingHouseId
        ]
      );
      
      const enrollmentId = enrollmentResult.insertId;
      console.log(`   ✅ Enrollment created (ID: ${enrollmentId})`);
      
      // 3. Create payment schedules (3 months: Sep, Oct, Nov only)
      const paymentSchedules = [
        { start: '2024-09-01', end: '2024-09-30', amount: student.rent },
        { start: '2024-10-01', end: '2024-10-31', amount: student.rent },
        { start: '2024-11-01', end: '2024-11-30', amount: student.rent }
      ];
      
      for (const schedule of paymentSchedules) {
        await connection.query(
          `INSERT INTO student_payment_schedules (
            enrollment_id, student_id, period_start_date, period_end_date, 
            amount_due, currency, created_at
          ) VALUES (?, ?, ?, ?, ?, 'USD', NOW())`,
          [enrollmentId, studentId, schedule.start, schedule.end, schedule.amount]
        );
      }
      console.log(`   ✅ Payment schedules created (3 months: Sep, Oct, Nov)`);
      
      // 4. Record payments made with August dates and handle overpayments
      if (student.paid > 0) {
        const adminFeePayment = student.adminFee;
        const firstMonthPayment = Math.min(student.paid - adminFeePayment, student.rent);
        
        // Record admin fee payment (August 15)
        if (adminFeePayment > 0) {
          await connection.query(
            `INSERT INTO student_payments (
              student_id, enrollment_id, amount, payment_date, 
              payment_method, payment_type, reference_number, 
              status, created_by, created_at
            ) VALUES (?, ?, ?, ?, 'cash', 'admin_fee', ?, 'completed', 1, NOW())`,
            [studentId, enrollmentId, adminFeePayment, paymentDates.adminFee, `ADM-${studentId}-AUG15`]
          );
        }
        
        // Record first month payment (August 20)
        if (firstMonthPayment > 0) {
          await connection.query(
            `INSERT INTO student_payments (
              student_id, enrollment_id, amount, payment_date, 
              payment_method, payment_type, reference_number, 
              status, created_by, created_at
            ) VALUES (?, ?, ?, ?, 'cash', 'monthly_rent', ?, 'completed', 1, NOW())`,
            [studentId, enrollmentId, firstMonthPayment, paymentDates.firstRent, `RENT-${studentId}-AUG20`]
          );
        }
        
        // Record advance payment (August 25) - Applied to September schedule
        if (student.advance && student.advance > 0) {
          await connection.query(
            `INSERT INTO student_payments (
              student_id, enrollment_id, amount, payment_date, 
              payment_method, payment_type, reference_number, 
              status, created_by, created_at
            ) VALUES (?, ?, ?, ?, 'cash', 'advance', ?, 'completed', 1, NOW())`,
            [studentId, enrollmentId, student.advance, paymentDates.advance, `ADV-${studentId}-AUG25`]
          );
        }
        
        // Handle overpayment logic - move remainder to next schedule
        const totalPaymentToFirstMonth = firstMonthPayment + (student.advance || 0);
        const firstMonthRent = student.rent;
        
        if (totalPaymentToFirstMonth > firstMonthRent) {
          const overpayment = totalPaymentToFirstMonth - firstMonthRent;
          console.log(`   💰 Overpayment detected: $${overpayment} - Moving to October schedule`);
          
          // Get the October schedule (second schedule)
          const [octoberSchedule] = await connection.query(
            'SELECT id FROM student_payment_schedules WHERE enrollment_id = ? AND period_start_date = ?',
            [enrollmentId, '2024-10-01']
          );
          
          if (octoberSchedule.length > 0) {
            // Apply overpayment to October schedule
            await connection.query(
              `UPDATE student_payment_schedules 
               SET amount_paid = amount_paid + ?, 
                   status = CASE 
                     WHEN amount_paid + ? >= amount_due THEN 'paid'
                     ELSE 'partial'
                   END
               WHERE id = ?`,
              [overpayment, overpayment, octoberSchedule[0].id]
            );
            
            console.log(`   ✅ Applied $${overpayment} overpayment to October schedule`);
          }
        }
        
        // Add payments to petty cash account
        const totalCashReceived = adminFeePayment + firstMonthPayment + (student.advance || 0);
        if (totalCashReceived > 0) {
          // Create petty cash transaction record
          await connection.query(
            `INSERT INTO petty_cash_transactions (
              boarding_house_id, transaction_type, amount, description, 
              reference_number, notes, transaction_date, created_by, created_at
            ) VALUES (?, 'student_payment', ?, ?, ?, ?, ?, 1, NOW())`,
            [
              boardingHouseId,
              totalCashReceived,
              `Student payment - ${student.name}`,
              `STU-${studentId}-${Date.now()}`,
              `Admin: $${adminFeePayment}, Rent: $${firstMonthPayment}, Advance: $${student.advance || 0}`,
              paymentDates.firstRent
            ]
          );
          
          // Update petty cash account balance
          await connection.query(
            `INSERT INTO petty_cash_accounts (boarding_house_id, current_balance, total_inflows, created_at)
             VALUES (?, ?, ?, NOW())
             ON DUPLICATE KEY UPDATE 
             current_balance = current_balance + ?,
             total_inflows = total_inflows + ?,
             updated_at = NOW()`,
            [boardingHouseId, totalCashReceived, totalCashReceived, totalCashReceived, totalCashReceived]
          );
          
          console.log(`   💰 Added $${totalCashReceived} to St Kilda petty cash`);
        }
        
        console.log(`   ✅ Payments recorded with August dates:`);
        console.log(`      Admin Fee: $${adminFeePayment} (${paymentDates.adminFee})`);
        console.log(`      First Rent: $${firstMonthPayment} (${paymentDates.firstRent})`);
        console.log(`      Advance: $${student.advance || 0} (${paymentDates.advance}) - Applied to September`);
      }
      
      // 5. Update room availability
      await connection.query(
        'UPDATE rooms SET available_beds = available_beds - 1, updated_at = NOW() WHERE id = ?',
        [roomId]
      );
      
      registeredStudents.push({
        id: studentId,
        name: student.name,
        room: student.room,
        roomId: roomId,
        enrollmentId: enrollmentId
      });
      
      console.log(`   ✅ ${student.name} fully registered and assigned to ${student.room} (Room ID: ${roomId})`);
    }
    
    await connection.commit();
    
    console.log('\n🎉 BULK REGISTRATION COMPLETED SUCCESSFULLY!');
    console.log(`📊 Summary:`);
    console.log(`   👥 Students Registered: ${registeredStudents.length}`);
    console.log(`   🏠 Rooms Used: ${uniqueRooms.length}`);
    console.log(`   📅 Enrollment Period: ${enrollmentStartDate} to ${enrollmentEndDate}`);
    console.log(`   📅 Payment Schedules: 3 months (Sep, Oct, Nov)`);
    console.log(`   💰 Payment Method: All payments recorded as CASH`);
    
    console.log('\n📋 Registered Students:');
    registeredStudents.forEach((student, index) => {
      console.log(`   ${index + 1}. ${student.name} → ${student.room} (Student ID: ${student.id})`);
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Error during bulk registration:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run the script
if (require.main === module) {
  bulkRegisterStudents()
    .then(() => {
      console.log('\n✅ Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error.message);
      process.exit(1);
    });
}

module.exports = { bulkRegisterStudents, studentData };
