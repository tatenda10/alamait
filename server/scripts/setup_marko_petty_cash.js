const db = require('../src/services/db');

async function setup() {
  const conn = await db.getConnection();
  try {
    // Step 1: Find Marko user
    console.log('Step 1: Finding user Marko...');
    const [users] = await conn.query("SELECT id, username FROM users WHERE LOWER(username) = 'marko' AND deleted_at IS NULL");
    
    if (users.length === 0) {
      throw new Error('User Marko not found. Please create the user first.');
    }
    
    const markoUserId = users[0].id;
    console.log(`Found Marko: User ID ${markoUserId}`);
    
    // Step 2: Find St Kilda boarding house
    console.log('\nStep 2: Finding St Kilda boarding house...');
    const [houses] = await conn.query("SELECT id FROM boarding_houses WHERE LOWER(name) = 'st kilda' AND deleted_at IS NULL");
    
    if (houses.length === 0) {
      throw new Error('St Kilda boarding house not found.');
    }
    
    const stKildaId = houses[0].id;
    console.log(`Found St Kilda: Boarding House ID ${stKildaId}`);
    
    // Step 3: Check existing expense accounts
    console.log('\nStep 3: Checking existing expense accounts...');
    const [expenseAccounts] = await conn.query(
      "SELECT id, code, name FROM chart_of_accounts WHERE type = 'Expense' AND deleted_at IS NULL ORDER BY code"
    );
    console.log('Available expense accounts:');
    expenseAccounts.forEach(acc => console.log(`  ${acc.code} - ${acc.name}`));
    
    // Step 4: Check if petty cash account already exists for Marko at St Kilda
    console.log('\nStep 4: Checking for existing petty cash account...');
    const [existing] = await conn.query(
      "SELECT id FROM petty_cash_accounts WHERE user_id = ? AND boarding_house_id = ? AND deleted_at IS NULL",
      [markoUserId, stKildaId]
    );
    
    if (existing.length > 0) {
      console.log(`Petty cash account already exists (ID: ${existing[0].id})`);
      console.log('Skipping creation.');
    } else {
      // Step 5: Create petty cash account for Marko
      console.log('\nStep 5: Creating petty cash account for Marko at St Kilda...');
      
      const [result] = await conn.query(
        `INSERT INTO petty_cash_accounts (
          user_id, 
          boarding_house_id, 
          account_name, 
          account_code, 
          initial_balance, 
          current_balance, 
          beginning_balance,
          total_inflows,
          total_outflows,
          status, 
          created_by, 
          created_at, 
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, NOW(), NOW())`,
        [
          markoUserId,
          stKildaId,
          'Petty Cash - Marko - St Kilda',
          'PC-MARKO-STK',
          0.00, // Will be set by opening balance transaction
          0.00,
          0.00,
          0.00,
          0.00,
          1 // created_by (sysadmin)
        ]
      );
      
      console.log(`✅ Petty cash account created successfully (ID: ${result.insertId})`);
    }
    
    // Step 6: Show summary
    console.log('\n=== Summary ===');
    console.log(`User: Marko (ID: ${markoUserId})`);
    console.log(`Boarding House: St Kilda (ID: ${stKildaId})`);
    console.log(`Account Code: PC-MARKO-STK`);
    console.log('\n✅ Setup complete. Ready to import transactions.');
    
    conn.release();
    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e.message);
    conn.release();
    process.exit(1);
  }
}

setup();

