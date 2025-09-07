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

// Belvedere student data from your tables
const belvedereStudentData = [
  { room: 'C1', name: 'Thandiwe', rent: 150.00, paid: 75.00 },
  { room: 'M1', name: 'Tamia Moyo', rent: 110.00, paid: 110.00 },
  { room: 'M1', name: 'Tinenyasha Gozho', rent: 110.00, paid: 110.00 },
  { room: 'M1', name: 'Candice Gavajena', rent: 80.00, paid: 80.00 },
  { room: 'M1', name: 'Natile Forbes', rent: 100.00, paid: 100.00 },
  { room: 'M1', name: 'Panashe', rent: 16.00, paid: 16.00 },
  { room: 'M1', name: 'Hope chibondwe', rent: 90.00, paid: 90.00 },
  { room: 'M1', name: 'Natilie Dhendere', rent: 110.00, paid: 110.00 },
  { room: 'C1', name: 'Nicole Khumalo', rent: 150.00, paid: 150.00 },
  { room: 'M1', name: 'Martha Buruyoyi', rent: 110.00, paid: 110.00 },
  { room: 'M1', name: 'Chido Dambeni', rent: 110.00, paid: 110.00 },
  { room: 'C1', name: 'Bridget Mugodi', rent: 150.00, paid: 150.00 },
  { room: 'M1', name: 'Tanisha Muziwanhanga', rent: 90.00, paid: 90.00 },
  { room: 'M1', name: 'Joyce Ndlovu', rent: 110.00, paid: 110.00 },
  { room: 'M1', name: 'Rejoice Chikwava', rent: 80.00, paid: 80.00 },
  { room: 'M1', name: 'Panashe Gutuza', rent: 90.00, paid: 90.00 },
  { room: 'M1', name: 'Glander Makambe', rent: 110.00, paid: 110.00 },
  { room: 'M1', name: 'Zvikomberero Gwatidza', rent: 80.00, paid: 80.00 },
  { room: 'M1', name: 'Bella Maramba', rent: 50.00, paid: 50.00 },
  { room: 'M1', name: 'Anita Gavajena', rent: 80.00, paid: 80.00 },
  { room: 'M1', name: 'Panashe Shaya', rent: 110.00, paid: 110.00 },
  { room: 'M1', name: 'Tanataswa Gavajena', rent: 80.00, paid: 80.00 },
  { room: 'M1', name: 'Sandra Nyakura', rent: 110.00, paid: 110.00 },
  { room: 'M1', name: 'Mugove Bumbira', rent: 100.00, paid: 100.00 },
  { room: 'M1', name: 'Geraldine Mumba', rent: 80.00, paid: 80.00 }
];

// Room mapping to existing database IDs (Boarding House 5)
const roomMapping = {
  'C1': null, // Will be found dynamically
  'M1': null  // Will be found dynamically
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

async function bulkRegisterBelvedereStudents() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log('🚀 Starting Belvedere student registration...');
    console.log(`📅 Enrollment Period: ${enrollmentStartDate} to ${enrollmentEndDate}`);
    console.log(`👥 Total Students: ${belvedereStudentData.length}`);
    
    await connection.beginTransaction();
    
    // Use Boarding House 5 as specified
    const boardingHouseId = 5;
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
    
    // Get room IDs for C1 and M1
    const [rooms] = await connection.query(
      'SELECT id, name, available_beds FROM rooms WHERE boarding_house_id = ? AND name IN ("C1", "M1") AND deleted_at IS NULL',
      [boardingHouseId]
    );
    
    console.log('\n🏠 Available Rooms:');
    rooms.forEach(room => {
      roomMapping[room.name] = room.id;
      console.log(`   ${room.name} (ID: ${room.id}) - Available beds: ${room.available_beds}`);
    });
    
    // Check if all required rooms are available
    const missingRooms = ['C1', 'M1'].filter(room => !roomMapping[room]);
    if (missingRooms.length > 0) {
      throw new Error(`Missing rooms: ${missingRooms.join(', ')}. Please create these rooms first.`);
    }
    
    // Ensure petty cash account exists
    const [pettyCashAccounts] = await connection.query(
      'SELECT * FROM petty_cash_accounts WHERE boarding_house_id = ?',
      [boardingHouseId]
    );
    
    if (pettyCashAccounts.length === 0) {
      console.log('\n💰 Creating petty cash account for Belvedere...');
      await connection.query(
        `INSERT INTO petty_cash_accounts (
          boarding_house_id, current_balance, beginning_balance, 
          total_inflows, total_outflows, created_at
        ) VALUES (?, 0.00, 0.00, 0.00, 0.00, NOW())`,
        [boardingHouseId]
      );
      console.log('✅ Petty cash account created for Belvedere');
    } else {
      console.log(`\n💰 Petty cash account exists: $${pettyCashAccounts[0].current_balance} balance`);
    }
    
    console.log('\n👥 Registering Students...');
    const registeredStudents = [];
    let totalCashReceived = 0;
    
    for (let i = 0; i < belvedereStudentData.length; i++) {
      const student = belvedereStudentData[i];
      const roomId = roomMapping[student.room];
      
      console.log(`\n📝 Processing ${i + 1}/25: ${student.name} (Room: ${student.room} → ID: ${roomId})`);
      
      // 1. Create student record
      const [studentResult] = await connection.query(
        `INSERT INTO students (
          full_name, national_id, university, gender, address, phone_number, 
          boarding_house_id, joined_at, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          student.name,
          `BEL${String(i + 1).padStart(3, '0')}`, // Generate ID
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
          20.00, // Standard admin fee
          0, // No security deposit
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
      
      // 4. Record payments made with August dates
      const adminFeePayment = 20.00;
      const firstMonthPayment = Math.min(student.paid - adminFeePayment, student.rent);
      const advancePayment = Math.max(0, student.paid - adminFeePayment - student.rent);
      
      // Record admin fee payment (August 15)
      await connection.query(
        `INSERT INTO student_payments (
          student_id, enrollment_id, amount, payment_date, 
          payment_method, payment_type, reference_number, 
          status, created_by, created_at
        ) VALUES (?, ?, ?, ?, 'cash', 'admin_fee', ?, 'completed', 1, NOW())`,
        [studentId, enrollmentId, adminFeePayment, paymentDates.adminFee, `ADM-${studentId}-AUG15`]
      );
      
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
      
      // Record advance payment (August 25)
      if (advancePayment > 0) {
        await connection.query(
          `INSERT INTO student_payments (
            student_id, enrollment_id, amount, payment_date, 
            payment_method, payment_type, reference_number, 
            status, created_by, created_at
          ) VALUES (?, ?, ?, ?, 'cash', 'advance', ?, 'completed', 1, NOW())`,
          [studentId, enrollmentId, advancePayment, paymentDates.advance, `ADV-${studentId}-AUG25`]
        );
      }
      
      // Add to petty cash
      const totalPayment = adminFeePayment + firstMonthPayment + advancePayment;
      totalCashReceived += totalPayment;
      
      // Create petty cash transaction record
      await connection.query(
        `INSERT INTO petty_cash_transactions (
          boarding_house_id, transaction_type, amount, description, 
          reference_number, notes, transaction_date, created_by, created_at
        ) VALUES (?, 'student_payment', ?, ?, ?, ?, ?, 1, NOW())`,
        [
          boardingHouseId,
          totalPayment,
          `Student payment - ${student.name}`,
          `BEL-${studentId}-${Date.now()}`,
          `Admin: $${adminFeePayment}, Rent: $${firstMonthPayment}, Advance: $${advancePayment}`,
          paymentDates.firstRent
        ]
      );
      
      // Update petty cash account balance
      await connection.query(
        `UPDATE petty_cash_accounts 
         SET current_balance = current_balance + ?,
             total_inflows = total_inflows + ?,
             updated_at = NOW()
         WHERE boarding_house_id = ?`,
        [totalPayment, totalPayment, boardingHouseId]
      );
      
      // Update room availability
      await connection.query(
        'UPDATE rooms SET available_beds = available_beds - 1, updated_at = NOW() WHERE id = ?',
        [roomId]
      );
      
      registeredStudents.push({
        id: studentId,
        name: student.name,
        room: student.room,
        roomId: roomId,
        enrollmentId: enrollmentId,
        totalPaid: totalPayment
      });
      
      console.log(`   ✅ ${student.name} fully registered and assigned to ${student.room} (Room ID: ${roomId})`);
      console.log(`   💰 Total paid: $${totalPayment} (Admin: $${adminFeePayment}, Rent: $${firstMonthPayment}, Advance: $${advancePayment})`);
    }
    
    await connection.commit();
    
    console.log('\n🎉 BELVEDERE REGISTRATION COMPLETED SUCCESSFULLY!');
    console.log(`📊 Summary:`);
    console.log(`   👥 Students Registered: ${registeredStudents.length}`);
    console.log(`   🏠 Rooms Used: 2 (C1, M1)`);
    console.log(`   📅 Enrollment Period: ${enrollmentStartDate} to ${enrollmentEndDate}`);
    console.log(`   📅 Payment Schedules: 3 months (Sep, Oct, Nov)`);
    console.log(`   💰 Total Cash Received: $${totalCashReceived.toFixed(2)}`);
    console.log(`   💰 Payment Method: All payments recorded as CASH to petty cash`);
    
    console.log('\n📋 Registered Students:');
    registeredStudents.forEach((student, index) => {
      console.log(`   ${index + 1}. ${student.name} → ${student.room} (Student ID: ${student.id}) - $${student.totalPaid}`);
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Error during Belvedere registration:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run the script
if (require.main === module) {
  bulkRegisterBelvedereStudents()
    .then(() => {
      console.log('\n✅ Belvedere registration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Belvedere registration failed:', error.message);
      process.exit(1);
    });
}

module.exports = { bulkRegisterBelvedereStudents, belvedereStudentData };
