require('dotenv').config();
const mysql = require('mysql2/promise');

async function assignStudentsAndCleanup() {
  console.log('🔧 Assigning new students and cleaning up departures...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alamait_db'
  });

  try {
    await connection.beginTransaction();

    const invoiceDate = '2025-10-29';
    const invoiceMonth = '2025-10';
    const adminFee = 20.00; // Admin fee

    // ========================================
    // 1. FIND CHARMAIN TINARWO
    // ========================================
    console.log('👤 Finding Charmain Tinarwo...');
    const [charmainResults] = await connection.execute(`
      SELECT id, student_id, full_name, status
      FROM students
      WHERE full_name LIKE '%Charmain%Tinarwo%'
        AND deleted_at IS NULL
      LIMIT 1
    `);

    if (charmainResults.length === 0) {
      console.log('❌ Charmain Tinarwo not found!');
      await connection.rollback();
      return;
    }

    const charmain = charmainResults[0];
    console.log(`✓ Found: ${charmain.full_name} (ID: ${charmain.id})`);

    // Get EXT1 room
    const [ext1Room] = await connection.execute(`
      SELECT r.id, r.name, bh.id as boarding_house_id
      FROM rooms r
      JOIN boarding_houses bh ON r.boarding_house_id = bh.id
      WHERE r.name = 'EXT1' AND r.deleted_at IS NULL
      LIMIT 1
    `);

    if (ext1Room.length === 0) {
      console.log('❌ EXT1 room not found!');
      await connection.rollback();
      return;
    }

    // Check if Charmain already has an enrollment
    const [existingCharmainEnrollment] = await connection.execute(`
      SELECT id FROM student_enrollments
      WHERE student_id = ? AND deleted_at IS NULL
    `, [charmain.id]);

    let charmainEnrollmentId;
    const monthlyRent = 160.00; // Standard monthly rent

    if (existingCharmainEnrollment.length > 0) {
      // Update existing enrollment
      charmainEnrollmentId = existingCharmainEnrollment[0].id;
      await connection.execute(`
        UPDATE student_enrollments
        SET room_id = ?,
            boarding_house_id = ?,
            agreed_amount = ?
        WHERE id = ?
      `, [ext1Room[0].id, ext1Room[0].boarding_house_id, monthlyRent, charmainEnrollmentId]);
      console.log(`✓ Updated existing enrollment for ${charmain.full_name} to EXT1`);
    } else {
      // Create new enrollment
      const [enrollmentResult] = await connection.execute(`
        INSERT INTO student_enrollments (
          student_id,
          boarding_house_id,
          room_id,
          start_date,
          agreed_amount,
          currency,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW())
      `, [charmain.id, ext1Room[0].boarding_house_id, ext1Room[0].id, '2025-10-01', monthlyRent, 'USD']);
      charmainEnrollmentId = enrollmentResult.insertId;
      console.log(`✓ Created new enrollment for ${charmain.full_name} in EXT1`);
    }

    // Create/update student account balance
    const [existingCharmainBalance] = await connection.execute(`
      SELECT id FROM student_account_balances
      WHERE student_id = ? AND deleted_at IS NULL
    `, [charmain.id]);

    if (existingCharmainBalance.length === 0) {
      await connection.execute(`
        INSERT INTO student_account_balances (
          student_id,
          enrollment_id,
          current_balance,
          currency,
          created_at
        ) VALUES (?, ?, ?, ?, NOW())
      `, [charmain.id, charmainEnrollmentId, 0, 'USD']);
      console.log(`✓ Created balance record for ${charmain.full_name}`);
    } else {
      await connection.execute(`
        UPDATE student_account_balances
        SET enrollment_id = ?
        WHERE id = ?
      `, [charmainEnrollmentId, existingCharmainBalance[0].id]);
      console.log(`✓ Updated balance record for ${charmain.full_name}`);
    }

    // Generate October invoice with admin fee for Charmain
    await generateInvoiceWithAdminFee(
      connection,
      charmain,
      charmainEnrollmentId,
      ext1Room[0].boarding_house_id,
      monthlyRent,
      adminFee,
      invoiceDate,
      invoiceMonth
    );

    // ========================================
    // 2. FIND TANAKA MATEMATEMA
    // ========================================
    console.log('\n👤 Finding Tanaka Matematema...');
    const [tanakaResults] = await connection.execute(`
      SELECT id, student_id, full_name, status
      FROM students
      WHERE full_name LIKE '%Tanaka%Matematema%'
        AND deleted_at IS NULL
      LIMIT 1
    `);

    if (tanakaResults.length === 0) {
      console.log('❌ Tanaka Matematema not found!');
      await connection.rollback();
      return;
    }

    const tanaka = tanakaResults[0];
    console.log(`✓ Found: ${tanaka.full_name} (ID: ${tanaka.id})`);

    // Get M6 room
    const [m6Room] = await connection.execute(`
      SELECT r.id, r.name, bh.id as boarding_house_id
      FROM rooms r
      JOIN boarding_houses bh ON r.boarding_house_id = bh.id
      WHERE r.name = 'M6' AND r.deleted_at IS NULL
      LIMIT 1
    `);

    if (m6Room.length === 0) {
      console.log('❌ M6 room not found!');
      await connection.rollback();
      return;
    }

    // Check if Tanaka already has an enrollment
    const [existingTanakaEnrollment] = await connection.execute(`
      SELECT id FROM student_enrollments
      WHERE student_id = ? AND deleted_at IS NULL
    `, [tanaka.id]);

    let tanakaEnrollmentId;
    const tanakaMonthlyRent = 220.00; // From the payment list

    if (existingTanakaEnrollment.length > 0) {
      // Update existing enrollment
      tanakaEnrollmentId = existingTanakaEnrollment[0].id;
      await connection.execute(`
        UPDATE student_enrollments
        SET room_id = ?,
            boarding_house_id = ?,
            agreed_amount = ?
        WHERE id = ?
      `, [m6Room[0].id, m6Room[0].boarding_house_id, tanakaMonthlyRent, tanakaEnrollmentId]);
      console.log(`✓ Updated existing enrollment for ${tanaka.full_name} to M6`);
    } else {
      // Create new enrollment
      const [enrollmentResult] = await connection.execute(`
        INSERT INTO student_enrollments (
          student_id,
          boarding_house_id,
          room_id,
          start_date,
          agreed_amount,
          currency,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW())
      `, [tanaka.id, m6Room[0].boarding_house_id, m6Room[0].id, '2025-10-01', tanakaMonthlyRent, 'USD']);
      tanakaEnrollmentId = enrollmentResult.insertId;
      console.log(`✓ Created new enrollment for ${tanaka.full_name} in M6`);
    }

    // Create/update student account balance for Tanaka
    const [existingTanakaBalance] = await connection.execute(`
      SELECT id FROM student_account_balances
      WHERE student_id = ? AND deleted_at IS NULL
    `, [tanaka.id]);

    if (existingTanakaBalance.length === 0) {
      await connection.execute(`
        INSERT INTO student_account_balances (
          student_id,
          enrollment_id,
          current_balance,
          currency,
          created_at
        ) VALUES (?, ?, ?, ?, NOW())
      `, [tanaka.id, tanakaEnrollmentId, 0, 'USD']);
      console.log(`✓ Created balance record for ${tanaka.full_name}`);
    } else {
      await connection.execute(`
        UPDATE student_account_balances
        SET enrollment_id = ?
        WHERE id = ?
      `, [tanakaEnrollmentId, existingTanakaBalance[0].id]);
      console.log(`✓ Updated balance record for ${tanaka.full_name}`);
    }

    // Generate October invoice with admin fee for Tanaka
    await generateInvoiceWithAdminFee(
      connection,
      tanaka,
      tanakaEnrollmentId,
      m6Room[0].boarding_house_id,
      tanakaMonthlyRent,
      adminFee,
      invoiceDate,
      invoiceMonth
    );

    // ========================================
    // 3. REMOVE LEONA DENGU
    // ========================================
    console.log('\n🗑️  Removing Leona Dengu...');
    const [leonaResults] = await connection.execute(`
      SELECT s.id, s.full_name, se.id as enrollment_id, r.name as room
      FROM students s
      LEFT JOIN student_enrollments se ON s.id = se.student_id AND se.deleted_at IS NULL
      LEFT JOIN rooms r ON se.room_id = r.id
      WHERE s.full_name LIKE '%Leona%Dengu%'
        AND s.deleted_at IS NULL
      LIMIT 1
    `);

    if (leonaResults.length > 0 && leonaResults[0].enrollment_id) {
      await connection.execute(`
        UPDATE student_enrollments
        SET deleted_at = NOW()
        WHERE id = ?
      `, [leonaResults[0].enrollment_id]);
      console.log(`✓ Removed enrollment for ${leonaResults[0].full_name} from ${leonaResults[0].room}`);
      
      // Set student status to inactive
      await connection.execute(`
        UPDATE students
        SET status = 'Inactive'
        WHERE id = ?
      `, [leonaResults[0].id]);
      console.log(`✓ Set ${leonaResults[0].full_name} status to Inactive`);
    } else {
      console.log('⚠️  Leona Dengu not found or already removed');
    }

    // ========================================
    // 4. REMOVE SHELTER MASOSONERE
    // ========================================
    console.log('\n🗑️  Removing Shelter Masosonere...');
    const [shelterResults] = await connection.execute(`
      SELECT s.id, s.full_name, se.id as enrollment_id, r.name as room
      FROM students s
      LEFT JOIN student_enrollments se ON s.id = se.student_id AND se.deleted_at IS NULL
      LEFT JOIN rooms r ON se.room_id = r.id
      WHERE s.full_name LIKE '%Shelter%Masosonere%'
        AND s.deleted_at IS NULL
      LIMIT 1
    `);

    if (shelterResults.length > 0 && shelterResults[0].enrollment_id) {
      await connection.execute(`
        UPDATE student_enrollments
        SET deleted_at = NOW()
        WHERE id = ?
      `, [shelterResults[0].enrollment_id]);
      console.log(`✓ Removed enrollment for ${shelterResults[0].full_name} from ${shelterResults[0].room}`);
      
      // Set student status to inactive
      await connection.execute(`
        UPDATE students
        SET status = 'Inactive'
        WHERE id = ?
      `, [shelterResults[0].id]);
      console.log(`✓ Set ${shelterResults[0].full_name} status to Inactive`);
    } else {
      console.log('⚠️  Shelter Masosonere not found or already removed');
    }

    await connection.commit();
    console.log('\n✅ All operations completed successfully!');

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await connection.end();
  }
}

async function generateInvoiceWithAdminFee(connection, student, enrollmentId, boardingHouseId, monthlyRent, adminFee, invoiceDate, invoiceMonth) {
  console.log(`\n💰 Generating October invoice for ${student.full_name}...`);

  const totalAmount = monthlyRent + adminFee;

  // Get account IDs
  const [receivableAccount] = await connection.execute(
    'SELECT id FROM chart_of_accounts WHERE code = ? AND deleted_at IS NULL',
    ['10005'] // Accounts Receivable
  );

  const [revenueAccount] = await connection.execute(
    'SELECT id FROM chart_of_accounts WHERE code = ? AND deleted_at IS NULL',
    ['40001'] // Rentals Income
  );

  // Create transaction
  const [transactionResult] = await connection.execute(`
    INSERT INTO transactions (
      transaction_type,
      student_id,
      reference,
      amount,
      currency,
      description,
      transaction_date,
      boarding_house_id,
      created_by,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
  `, [
    'monthly_invoice',
    student.id, // Use database ID, not student_id field
    `INV-${invoiceMonth}-${enrollmentId}`,
    totalAmount,
    'USD',
    `October 2025 Invoice - ${student.full_name} (Rent: $${monthlyRent} + Admin Fee: $${adminFee})`,
    invoiceDate,
    boardingHouseId,
    1
  ]);

  const transactionId = transactionResult.insertId;

  // Update student balance (debit - increases what they owe)
  await connection.execute(`
    UPDATE student_account_balances
    SET current_balance = current_balance - ?
    WHERE student_id = ?
  `, [totalAmount, student.id]);

  // Create journal entries
  // Debit: Accounts Receivable
  await connection.execute(`
    INSERT INTO journal_entries (
      transaction_id,
      account_id,
      entry_type,
      amount,
      description,
      boarding_house_id,
      created_by,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
  `, [
    transactionId,
    receivableAccount[0].id,
    'debit',
    totalAmount,
    `October invoice - Debit Accounts Receivable`,
    boardingHouseId,
    1
  ]);

  // Credit: Revenue
  await connection.execute(`
    INSERT INTO journal_entries (
      transaction_id,
      account_id,
      entry_type,
      amount,
      description,
      boarding_house_id,
      created_by,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
  `, [
    transactionId,
    revenueAccount[0].id,
    'credit',
    totalAmount,
    `October invoice - Credit Rentals Income`,
    boardingHouseId,
    1
  ]);

  console.log(`✓ Invoice generated: $${monthlyRent} (rent) + $${adminFee} (admin) = $${totalAmount} total`);
  console.log(`✓ Transaction ID: ${transactionId}`);
}

assignStudentsAndCleanup();

