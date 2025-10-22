const db = require('../src/services/db');
const { recalculateAllAccountBalances } = require('../src/services/accountBalanceService');

async function enterPaymentsExcludingPayment1() {
  const conn = await db.getConnection();
  try {
    console.log('📝 Entering payments from image (excluding PAYMENT 1 column)...\n');

    // PAYMENT 1 column amounts to exclude (from the image)
    const payment1Amounts = [
      180.00, 130.00, 150.00, 170.00, 120.00, 100.00, 70.00, 190.00, 20.00, 240.00,
      95.00, 100.00, 60.00, 65.00, 540.00, 210.00, 220.00, 200.00, 160.00, 150.00
    ];

    // Payment data from the image (excluding PAYMENT 1 column amounts)
    const paymentData = [
      { name: "Trypheane Chinembiri", amount: 140.00, room: "M5" },
      { name: "Leona Dengu", amount: 180.00, room: "M6" },
      { name: "Takudzwa Makunde", amount: 390.00, room: "C2" },
      { name: "Kudzai Matare", amount: 200.00, room: "M7" },
      { name: "Shantel Mashe", amount: 298.00, room: "Ext 2" },
      { name: "Anita Gwenda", amount: 200.00, room: "M4" },
      { name: "Lillian Chatikobo", amount: 190.00, room: "M1" },
      { name: "Sharon Matanha", amount: 298.00, room: "Ext 1" },
      { name: "Bellis Mapetere", amount: 200.00, room: "M8" },
      { name: "Tatenda Kamatando", amount: 220.00, room: "Bus 1" },
      { name: "Fay Mubaiwa", amount: 215.00, room: "Bus 2" },
      { name: "Christine Mutsikwa", amount: 180.00, room: "Up 1" },
      { name: "Bertha Mwangu", amount: 130.00, room: "Up 2" },
      { name: "Merrylin Makunzva", amount: 180.00, room: "C1" },
      { name: "Shantell Mawarira", amount: 150.00, room: "M3" },
      { name: "Salina Saidi", amount: 170.00, room: "Exclusive" },
      { name: "Tinotenda Bwangangwanyo", amount: 120.00, room: "M5" },
      { name: "Kimberly Nkomo", amount: 100.00, room: "M6" },
      { name: "Kimberly Mutowembwa", amount: 200.00, room: "C2" },
      { name: "Alicia Mutamuko", amount: 150.00, room: "M7" },
      { name: "Tawana Kuwana", amount: 180.00, room: "Ext 2" },
      { name: "Bertha Majoni", amount: 190.00, room: "M4" },
      { name: "Lorraine Mlambo", amount: 120.00, room: "M1" },
      { name: "Tinotenda Magiga", amount: 100.00, room: "Ext 1" },
      { name: "Rumbidzai Manyaora", amount: 100.00, room: "M8" },
      { name: "Precious Mashava", amount: 180.00, room: "Bus 1" },
      { name: "Tanaka Chikonyera", amount: 130.00, room: "Bus 2" },
      { name: "Nyashadzashe Chinorwiwa", amount: 120.00, room: "Up 1" },
      { name: "Kimbely Bones", amount: 215.00, room: "Up 2" },
      { name: "Natasha Chinho", amount: 200.00, room: "C1" },
      { name: "Tadiwa", amount: 180.00, room: "M3" },
      { name: "Tadiwa Mhloro", amount: 300.00, room: "Exclusive" },
      { name: "Varaidzo Tafirei", amount: 180.00, room: "M5" },
      { name: "Precious Dziva", amount: 190.00, room: "M6" },
      { name: "Shelter Masosonere", amount: 360.00, room: "C2" },
      { name: "Munashe", amount: 180.00, room: "M7" },
      { name: "Sandra Chirinda", amount: 250.00, room: "Ext 2" },
      { name: "Chantelle Gora", amount: 95.00, room: "M4" },
      { name: "Shalom Gora", amount: 95.00, room: "M1" },
      { name: "Ruvimbo Singe", amount: 200.00, room: "Ext 1" },
      { name: "Thelma Nzviramiri", amount: 160.00, room: "M8" },
      { name: "Fadzai Mhizha", amount: 70.00, room: "Bus 1" },
      { name: "Kuziwa", amount: 60.00, room: "Bus 2" },
      { name: "Mitchel Chikosha", amount: 100.00, room: "Up 1" },
      { name: "Vimbai", amount: 180.00, room: "Up 2" },
      { name: "Vannessa Magorimbo", amount: 100.00, room: "C1" },
      { name: "Agape Chiware", amount: 180.00, room: "M3" },
      { name: "Paidamoyo Munyimi", amount: 500.00, room: "Exclusive" },
      { name: "Gracious", amount: 180.00, room: "M5" },
      { name: "Grace Vutika", amount: 640.00, room: "M6" },
      { name: "Rachel Madembe", amount: 200.00, room: "C2" },
      { name: "Pelagia Gomakalila", amount: 210.00, room: "M7" },
      { name: "Farai Muzembe", amount: 220.00, room: "Ext 2" },
      { name: "Tinotenda Chidavaenzi", amount: 200.00, room: "M4" },
      { name: "Dion sengamai", amount: 100.00, room: "M1" },
      { name: "Emma Yoradin", amount: 160.00, room: "Ext 1" },
      { name: "Ropafadzo Masara", amount: 150.00, room: "M8" },
      { name: "Kudzai Pemhiwa", amount: 180.00, room: "Bus 1" }
    ];

    // Filter out PAYMENT 1 amounts
    const filteredPayments = paymentData.filter(payment => 
      !payment1Amounts.includes(payment.amount)
    );

    console.log(`📊 Total payments from image: ${paymentData.length}`);
    console.log(`🚫 PAYMENT 1 amounts to exclude: ${payment1Amounts.length}`);
    console.log(`✅ Payments to enter: ${filteredPayments.length}`);

    // Get account IDs
    const [cashAccount] = await conn.query(
      `SELECT id FROM chart_of_accounts WHERE code = '10002' AND deleted_at IS NULL`
    );
    const [arAccount] = await conn.query(
      `SELECT id FROM chart_of_accounts WHERE code = '10005' AND deleted_at IS NULL`
    );

    if (!cashAccount[0] || !arAccount[0]) {
      console.log('❌ Could not find Cash or Accounts Receivable accounts');
      conn.release();
      process.exit(1);
    }

    const cashAccountId = cashAccount[0].id;
    const arAccountId = arAccount[0].id;

    // Get a default boarding house ID
    const [boardingHouses] = await conn.query(
      `SELECT id FROM boarding_houses WHERE deleted_at IS NULL LIMIT 1`
    );
    
    if (!boardingHouses[0]) {
      console.log('❌ Could not find any boarding house');
      conn.release();
      process.exit(1);
    }

    const defaultBoardingHouseId = boardingHouses[0].id;

    console.log(`💰 Cash Account ID: ${cashAccountId}`);
    console.log(`📊 Accounts Receivable ID: ${arAccountId}`);
    console.log(`🏠 Default Boarding House ID: ${defaultBoardingHouseId}`);

    // Create transactions and journal entries
    let createdTransactions = 0;
    let createdJournals = 0;

    for (const payment of filteredPayments) {
      // Create transaction
      const [transactionResult] = await conn.query(
        `INSERT INTO transactions 
         (transaction_type, amount, description, transaction_date, created_at) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          'payment',
          payment.amount,
          `Payment from ${payment.name}`,
          '2025-09-01',
          '2025-09-01 00:00:00'
        ]
      );

      const transactionId = transactionResult.insertId;
      createdTransactions++;

      // Create journal entries
      // Debit Cash
      await conn.query(
        `INSERT INTO journal_entries 
         (transaction_id, account_id, boarding_house_id, entry_type, amount, description, created_by, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          transactionId,
          cashAccountId,
          defaultBoardingHouseId,
          'debit',
          payment.amount,
          `Payment received - Debit Cash - ${payment.name}`,
          1, // Default user ID
          '2025-09-01 00:00:00'
        ]
      );

      // Credit Accounts Receivable
      await conn.query(
        `INSERT INTO journal_entries 
         (transaction_id, account_id, boarding_house_id, entry_type, amount, description, created_by, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          transactionId,
          arAccountId,
          defaultBoardingHouseId,
          'credit',
          payment.amount,
          `Payment received - Credit Receivable - ${payment.name}`,
          1, // Default user ID
          '2025-09-01 00:00:00'
        ]
      );

      createdJournals += 2;
    }

    console.log(`\n✅ Created ${createdTransactions} payment transactions`);
    console.log(`✅ Created ${createdJournals} journal entries`);

    // Recalculate balances
    console.log('\n🔄 Recalculating account balances...');
    await recalculateAllAccountBalances();

    // Check trial balance
    console.log('\n📊 Checking trial balance...');
    const [journalTotals] = await conn.query(
      `SELECT 
        SUM(CASE WHEN entry_type = 'debit' THEN amount ELSE 0 END) as total_debits,
        SUM(CASE WHEN entry_type = 'credit' THEN amount ELSE 0 END) as total_credits
      FROM journal_entries 
      WHERE deleted_at IS NULL`
    );

    const totalDebits = parseFloat(journalTotals[0]?.total_debits || 0);
    const totalCredits = parseFloat(journalTotals[0]?.total_credits || 0);
    const difference = totalDebits - totalCredits;

    console.log(`Trial Balance:`);
    console.log(`  Total Debits: $${totalDebits.toFixed(2)}`);
    console.log(`  Total Credits: $${totalCredits.toFixed(2)}`);
    console.log(`  Difference: $${difference.toFixed(2)}`);
    console.log(`  Balanced: ${Math.abs(difference) < 0.01 ? '✅ YES' : '❌ NO'}`);

    // Calculate total amount
    const totalAmount = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
    console.log(`\n💰 Total amount entered: $${totalAmount.toFixed(2)}`);

    console.log('\n✅ Payment transactions and journal entries created successfully!');
    console.log('📝 Excluded PAYMENT 1 column amounts as requested');
    console.log('📅 All transactions dated September 1, 2025');

    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e);
    conn.release();
    process.exit(1);
  }
}

enterPaymentsExcludingPayment1();
