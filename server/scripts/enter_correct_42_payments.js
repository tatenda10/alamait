const db = require('../src/services/db');
const { recalculateAllAccountBalances } = require('../src/services/accountBalanceService');

async function enterCorrect42Payments() {
  const conn = await db.getConnection();
  try {
    console.log('📝 Entering the correct 42 payments from the image...\n');

    // The exact 42 payments from PAYMENT 2, PAYMENT 3, and unlabeled fourth column
    const paymentData = [
      // From PAYMENT 2 column (excluding amounts that appear in PAYMENT 1)
      { name: "Pelagia Gomakalila", amount: 210.00, room: "C1" },
      { name: "Farai Muzembe", amount: 220.00, room: "Ext 2" },
      { name: "Tinotenda Chidavaenzi", amount: 200.00, room: "Bus 2" },
      { name: "Dion sengamai", amount: 100.00, room: "Ext 1" },
      { name: "Emma Yoradin", amount: 160.00, room: "Bus 1" },
      { name: "Ropafadzo Masara", amount: 150.00, room: "M8" },
      
      // From PAYMENT 3 column (excluding amounts that appear in PAYMENT 1)
      { name: "Trypheane Chinembiri", amount: 140.00, room: "M5" },
      { name: "Anita Gwenda", amount: 140.00, room: "Ext 2" },
      { name: "Lillian Chatikobo", amount: 20.00, room: "M4" },
      { name: "Bellis Mapetere", amount: 180.00, room: "M1" },
      { name: "Bertha Mwangu", amount: 130.00, room: "Bus 2" },
      { name: "Merrylin Makunzva", amount: 180.00, room: "M5" },
      { name: "Shantell Mawarira", amount: 150.00, room: "M5" },
      { name: "Salina Saidi", amount: 170.00, room: "M2" },
      { name: "Tinotenda Bwangangwanyo", amount: 120.00, room: "M2" },
      { name: "Kimberly Nkomo", amount: 80.00, room: "M8" },
      { name: "Alicia Mutamuko", amount: 150.00, room: "M6" },
      { name: "Tawana Kuwana", amount: 187.00, room: "M7" },
      { name: "Lorraine Mlambo", amount: 70.00, room: "M2" },
      { name: "Tinotenda Magiga", amount: 100.00, room: "M2" },
      { name: "Rumbidzai Manyaora", amount: 100.00, room: "Up 1" },
      { name: "Tanaka Chikonyera", amount: 130.00, room: "Bus 1" },
      { name: "Nyashadzashe Chinorwiwa", amount: 120.00, room: "UP 1" },
      { name: "Natasha Chinho", amount: 180.00, room: "M1" },
      { name: "Precious Dziva", amount: 190.00, room: "C2" },
      { name: "Shelter Masosonere", amount: 20.00, room: "M3" },
      { name: "Munashe", amount: 20.00, room: "Ext 1" },
      { name: "Sandra Chirinda", amount: 240.00, room: "C1" },
      { name: "Chantelle Gora", amount: 95.00, room: "Ext 1" },
      { name: "Shalom Gora", amount: 95.00, room: "Ext 1" },
      { name: "Ruvimbo Singe", amount: 20.00, room: "M3" },
      { name: "Thelma Nzviramiri", amount: 100.00, room: "Ext 2" },
      { name: "Fadzai Mhizha", amount: 70.00, room: "Bus 2" },
      { name: "Kuziwa", amount: 80.00, room: "Up 2" },
      { name: "Mitchel Chikosha", amount: 60.00, room: "M8" },
      { name: "Vannessa Magorimbo", amount: 65.00, room: "Bus 1" },
      { name: "Rachel Madembe", amount: 540.00, room: "M3" },
      { name: "Pelagia Gomakalila", amount: 190.00, room: "C1" },
      
      // From unlabeled fourth column
      { name: "Rumbidzai Manyaora", amount: 20.00, room: "Up 1" },
      { name: "Mitchel Chikosha", amount: 20.00, room: "M8" },
      { name: "Vannessa Magorimbo", amount: 20.00, room: "Bus 1" }
    ];

    console.log(`📊 Total payments to enter: ${paymentData.length}`);
    
    const totalAmount = paymentData.reduce((sum, p) => sum + p.amount, 0);
    console.log(`💰 Total amount: $${totalAmount.toFixed(2)}`);

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

    for (const payment of paymentData) {
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

    console.log('\n✅ Payment transactions and journal entries created successfully!');
    console.log(`📝 Entered exactly ${paymentData.length} payments as requested`);
    console.log(`💰 Total amount: $${totalAmount.toFixed(2)}`);
    console.log('📅 All transactions dated September 1, 2025');

    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e);
    conn.release();
    process.exit(1);
  }
}

enterCorrect42Payments();
