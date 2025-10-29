# Double-Entry Accounting System Analysis

## Executive Summary

After analyzing the codebase, I've found that the system has **mixed implementation** of double-entry accounting:
- ✅ **Student Payments, Invoices, and Expenses** - Already using double-entry with journal entries
- ❌ **Petty Cash Transactions** - NOT using double-entry (single-entry system)
- ⚠️ **Issue:** Journal entries are NOT syncing to `current_account_balances` table

---

## ✅ Areas Already Using Double-Entry Accounting

### 1. Student Payments (`paymentController.js`, `studentController.js`)
**Status:** ✅ CORRECT - Uses double-entry

**Example:** When a student pays rent
```javascript
// Creates journal entries:
DEBIT: Cash/Bank Account (Asset increases)
CREDIT: Accounts Receivable (Asset decreases)

// Also updates:
- student_payments table
- student_account_balances table
- transactions table
- journal_entries table
- current_account_balances table
```

**Code Reference:** `server/src/controllers/paymentController.js` (lines 33-418)

---

### 2. Student Invoices (`monthlyInvoiceController.js`, `studentController.js`)
**Status:** ✅ CORRECT - Uses double-entry

**Example:** When generating monthly invoices
```javascript
// Creates journal entries:
DEBIT: Accounts Receivable (Asset increases)
CREDIT: Rentals Income (Revenue increases)

// Also updates:
- student_invoices table
- student_account_balances table
- transactions table
- journal_entries table
```

**Code Reference:** `server/src/controllers/monthlyInvoiceController.js` (lines 113-204)

---

### 3. Expenses (`expenseController.js`)
**Status:** ✅ CORRECT - Uses double-entry

**Example:** When recording an expense
```javascript
// Creates journal entries:
DEBIT: Expense Account (e.g., Utilities, Repairs)
CREDIT: Cash/Bank Account OR Accounts Payable

// Also updates:
- expenses table
- transactions table
- journal_entries table
- current_account_balances table (via triggers/manual updates)
```

**Code Reference:** `server/src/controllers/expenseController.js` (lines 208-290)

---

## ❌ Areas NOT Using Double-Entry Accounting

### 1. Petty Cash Transactions (`pettyCashController.js`)
**Status:** ❌ INCORRECT - Using single-entry accounting

**Current Implementation:**
```javascript
// When recording a petty cash expense:
1. Updates petty_cash_accounts.current_balance (SINGLE ENTRY)
2. Inserts into petty_cash_transactions
3. Inserts into expenses table
4. NO JOURNAL ENTRIES CREATED
5. NO UPDATE TO current_account_balances
```

**Code Reference:** `server/src/controllers/pettyCashController.js` (lines 776-884)

**Problem:**
- Petty cash balance changes don't reflect in the general ledger
- No audit trail via journal entries
- Breaks the accounting equation
- Petty Cash account (10001) is not syncing with petty_cash_accounts table

---

### 2. Petty Cash User Transactions (`routes/pettyCashUser.js`)
**Status:** ❌ INCORRECT - Using single-entry accounting

**Current Implementation:**
```javascript
// When a petty cash user records a transaction:
1. Inserts into petty_cash_transactions (SINGLE ENTRY)
2. Updates petty_cash_accounts.current_balance (SINGLE ENTRY)
3. NO JOURNAL ENTRIES CREATED
4. NO UPDATE TO current_account_balances
```

**Code Reference:** `server/src/routes/pettyCashUser.js` (lines 157-285)

---

## ⚠️ Critical Issue: Journal Entries Not Syncing to Current Account Balances

### Problem
The system creates **journal entries** correctly, but these entries are **NOT automatically updating** the `current_account_balances` table.

### Evidence
1. Journal entries are created in `journal_entries` table
2. `current_account_balances` table exists separately
3. No trigger or scheduled job to sync journal entries → current_account_balances
4. Manual updates to `current_account_balances` happen in some places, but not consistently

### Impact
- **Trial Balance** and **Balance Sheet** read from `current_account_balances`
- If journal entries don't sync, reports will be incorrect
- Data integrity issues between journal entries and account balances

---

## 📋 Recommended Solutions

### Solution 1: Fix Petty Cash to Use Double-Entry (HIGH PRIORITY)

#### Current Flow:
```
Petty Cash Expense → Update petty_cash_accounts → Insert petty_cash_transactions → Done
```

#### Recommended Flow:
```
Petty Cash Expense → Create Transaction → Create Journal Entries:
  DEBIT: Expense Account (e.g., 50010 - House Keeping)
  CREDIT: Petty Cash (10001)
→ Update current_account_balances → Update petty_cash_accounts
```

#### Implementation Steps:

**1. Modify `pettyCashController.js` - `addExpense` function:**
```javascript
exports.addExpense = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const {
      amount,
      description,
      expense_account_id,
      category,
      vendor_name,
      receipt_number,
      notes,
      transaction_date
    } = req.body;
    
    const userId = req.user.id;
    const boardingHouseId = req.user.boarding_house_id;
    const expenseAmount = parseFloat(amount);

    // 1. Create transaction record
    const [transactionResult] = await connection.query(
      `INSERT INTO transactions (
        transaction_type,
        reference,
        amount,
        currency,
        description,
        transaction_date,
        boarding_house_id,
        created_by,
        status
      ) VALUES (?, ?, ?, 'USD', ?, ?, ?, ?, 'posted')`,
      [
        'petty_cash_expense',
        `PC-EXP-${Date.now()}`,
        expenseAmount,
        description,
        transaction_date || new Date(),
        boardingHouseId,
        userId
      ]
    );

    // 2. Create journal entries (DOUBLE-ENTRY)
    
    // DEBIT: Expense Account
    await connection.query(
      `INSERT INTO journal_entries (
        transaction_id,
        account_id,
        entry_type,
        amount,
        description,
        boarding_house_id,
        created_by
      ) VALUES (?, ?, 'debit', ?, ?, ?, ?)`,
      [
        transactionResult.insertId,
        expense_account_id,
        expenseAmount,
        `${description} - Expense`,
        boardingHouseId,
        userId
      ]
    );
    
    // CREDIT: Petty Cash (Account code: 10001)
    const [pettyCashAccount] = await connection.query(
      `SELECT id FROM chart_of_accounts WHERE code = '10001' AND deleted_at IS NULL`
    );
    
    if (pettyCashAccount.length === 0) {
      throw new Error('Petty Cash account not found in chart of accounts');
    }
    
    await connection.query(
      `INSERT INTO journal_entries (
        transaction_id,
        account_id,
        entry_type,
        amount,
        description,
        boarding_house_id,
        created_by
      ) VALUES (?, ?, 'credit', ?, ?, ?, ?)`,
      [
        transactionResult.insertId,
        pettyCashAccount[0].id,
        expenseAmount,
        `${description} - Credit Petty Cash`,
        boardingHouseId,
        userId
      ]
    );
    
    // 3. Update current_account_balances
    // Debit expense account (increases balance)
    await connection.query(
      `INSERT INTO current_account_balances (account_code, current_balance, updated_at)
       VALUES (
         (SELECT code FROM chart_of_accounts WHERE id = ?),
         ?,
         NOW()
       )
       ON DUPLICATE KEY UPDATE
       current_balance = current_balance + ?,
       updated_at = NOW()`,
      [expense_account_id, expenseAmount, expenseAmount]
    );
    
    // Credit petty cash account (decreases balance)
    await connection.query(
      `UPDATE current_account_balances
       SET current_balance = current_balance - ?,
           updated_at = NOW()
       WHERE account_code = '10001'`,
      [expenseAmount]
    );
    
    // 4. Update petty_cash_accounts (for petty cash module tracking)
    await connection.query(
      `UPDATE petty_cash_accounts 
       SET current_balance = current_balance - ?,
           total_outflows = total_outflows + ?,
           updated_at = NOW()
       WHERE petty_cash_user_id = ? AND boarding_house_id = ?`,
      [expenseAmount, expenseAmount, userId, boardingHouseId]
    );
    
    // 5. Create petty_cash_transactions record
    await connection.query(
      `INSERT INTO petty_cash_transactions 
       (petty_cash_user_id, boarding_house_id, transaction_id, transaction_type, amount, description, category, vendor_name, receipt_number, notes, transaction_date, created_by)
       VALUES (?, ?, ?, 'expense', ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, boardingHouseId, transactionResult.insertId, expenseAmount, description, category, vendor_name, receipt_number, notes, transaction_date || new Date(), userId]
    );
    
    // 6. Create expense record
    await connection.query(
      `INSERT INTO expenses 
       (transaction_id, boarding_house_id, expense_account_id, amount, description, expense_category, vendor_name, receipt_number, notes, payment_method, status, expense_date, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'petty_cash', 'paid', ?, ?)`,
      [transactionResult.insertId, boardingHouseId, expense_account_id, expenseAmount, description, category, vendor_name, receipt_number, notes, transaction_date || new Date(), userId]
    );
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Petty cash expense recorded successfully with double-entry accounting',
      transaction_id: transactionResult.insertId
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error adding petty cash expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record petty cash expense'
    });
  } finally {
    connection.release();
  }
};
```

**2. Modify `routes/pettyCashUser.js` - POST `/transactions`:**
- Apply same double-entry logic as above
- Ensure all petty cash expenses create journal entries
- Update both `current_account_balances` and `petty_cash_accounts`

---

### Solution 2: Create Journal Entry Sync System (HIGH PRIORITY)

#### Option A: Database Triggers (Recommended)

Create triggers to automatically update `current_account_balances` when journal entries are created:

```sql
-- Trigger for journal entries INSERT
DELIMITER $$

CREATE TRIGGER sync_journal_to_balance_after_insert
AFTER INSERT ON journal_entries
FOR EACH ROW
BEGIN
  DECLARE account_code VARCHAR(50);
  
  -- Get account code
  SELECT code INTO account_code
  FROM chart_of_accounts
  WHERE id = NEW.account_id AND deleted_at IS NULL;
  
  -- Update current_account_balances
  IF NEW.entry_type = 'debit' THEN
    INSERT INTO current_account_balances (account_code, current_balance, updated_at)
    VALUES (account_code, NEW.amount, NOW())
    ON DUPLICATE KEY UPDATE
      current_balance = current_balance + NEW.amount,
      updated_at = NOW();
  ELSE -- credit
    INSERT INTO current_account_balances (account_code, current_balance, updated_at)
    VALUES (account_code, -NEW.amount, NOW())
    ON DUPLICATE KEY UPDATE
      current_balance = current_balance - NEW.amount,
      updated_at = NOW();
  END IF;
END$$

DELIMITER ;
```

```sql
-- Trigger for journal entries DELETE (for rollbacks)
DELIMITER $$

CREATE TRIGGER sync_journal_to_balance_after_delete
AFTER DELETE ON journal_entries
FOR EACH ROW
BEGIN
  DECLARE account_code VARCHAR(50);
  
  -- Get account code
  SELECT code INTO account_code
  FROM chart_of_accounts
  WHERE id = OLD.account_id AND deleted_at IS NULL;
  
  -- Reverse the balance update
  IF OLD.entry_type = 'debit' THEN
    UPDATE current_account_balances
    SET current_balance = current_balance - OLD.amount,
        updated_at = NOW()
    WHERE account_code = account_code;
  ELSE -- credit
    UPDATE current_account_balances
    SET current_balance = current_balance + OLD.amount,
        updated_at = NOW()
    WHERE account_code = account_code;
  END IF;
END$$

DELIMITER ;
```

#### Option B: Application-Level Sync Function

Create a helper function that's called after every journal entry creation:

```javascript
// server/src/services/accountingService.js

const db = require('./db');

async function syncJournalEntriesToBalances(transactionId, connection) {
  try {
    // Get all journal entries for this transaction
    const [entries] = await connection.query(
      `SELECT je.*, coa.code as account_code
       FROM journal_entries je
       JOIN chart_of_accounts coa ON je.account_id = coa.id
       WHERE je.transaction_id = ? AND coa.deleted_at IS NULL`,
      [transactionId]
    );

    // Update current_account_balances for each entry
    for (const entry of entries) {
      const amount = parseFloat(entry.amount);
      const adjustedAmount = entry.entry_type === 'debit' ? amount : -amount;

      await connection.query(
        `INSERT INTO current_account_balances (account_code, current_balance, updated_at)
         VALUES (?, ?, NOW())
         ON DUPLICATE KEY UPDATE
         current_balance = current_balance + ?,
         updated_at = NOW()`,
        [entry.account_code, adjustedAmount, adjustedAmount]
      );
    }

    return { success: true };
  } catch (error) {
    console.error('Error syncing journal entries to balances:', error);
    throw error;
  }
}

module.exports = {
  syncJournalEntriesToBalances
};
```

Then call this function after every journal entry creation:
```javascript
const accountingService = require('../services/accountingService');

// After creating journal entries
await accountingService.syncJournalEntriesToBalances(transactionResult.insertId, connection);
```

---

### Solution 3: Implement Account Reconciliation (MEDIUM PRIORITY)

Create a reconciliation process to verify that:
1. Sum of journal entries per account = `current_account_balances`
2. Total debits = Total credits (always)
3. Petty cash balance in `petty_cash_accounts` = Petty Cash (10001) in `current_account_balances`

```javascript
// server/scripts/reconcile_accounts.js

async function reconcileAccounts() {
  const connection = await db.getConnection();
  
  try {
    // 1. Check if journal entries match current_account_balances
    const [accounts] = await connection.query(`
      SELECT 
        coa.code,
        coa.name,
        COALESCE(cab.current_balance, 0) as balance_table_amount,
        COALESCE(SUM(CASE WHEN je.entry_type = 'debit' THEN je.amount ELSE -je.amount END), 0) as journal_entries_amount,
        COALESCE(cab.current_balance, 0) - COALESCE(SUM(CASE WHEN je.entry_type = 'debit' THEN je.amount ELSE -je.amount END), 0) as difference
      FROM chart_of_accounts coa
      LEFT JOIN current_account_balances cab ON coa.code = cab.account_code
      LEFT JOIN journal_entries je ON coa.id = je.account_id
      WHERE coa.deleted_at IS NULL
      GROUP BY coa.code, coa.name, cab.current_balance
      HAVING ABS(difference) > 0.01
    `);

    if (accounts.length > 0) {
      console.log('❌ Accounts with discrepancies:');
      console.table(accounts);
    } else {
      console.log('✅ All accounts reconciled successfully');
    }

    // 2. Check if debits = credits
    const [totals] = await connection.query(`
      SELECT 
        SUM(CASE WHEN entry_type = 'debit' THEN amount ELSE 0 END) as total_debits,
        SUM(CASE WHEN entry_type = 'credit' THEN amount ELSE 0 END) as total_credits,
        SUM(CASE WHEN entry_type = 'debit' THEN amount ELSE 0 END) - 
        SUM(CASE WHEN entry_type = 'credit' THEN amount ELSE 0 END) as difference
      FROM journal_entries
    `);

    console.log('\n📊 Journal Entries Totals:');
    console.log(`Total Debits: $${totals[0].total_debits}`);
    console.log(`Total Credits: $${totals[0].total_credits}`);
    console.log(`Difference: $${totals[0].difference}`);
    
    if (Math.abs(totals[0].difference) > 0.01) {
      console.log('❌ WARNING: Debits do not equal credits!');
    } else {
      console.log('✅ Debits equal credits');
    }

    // 3. Check petty cash reconciliation
    const [pettyCash] = await connection.query(`
      SELECT 
        cab.current_balance as general_ledger_balance,
        COALESCE(SUM(pca.current_balance), 0) as petty_cash_accounts_balance,
        cab.current_balance - COALESCE(SUM(pca.current_balance), 0) as difference
      FROM current_account_balances cab
      LEFT JOIN petty_cash_accounts pca ON pca.deleted_at IS NULL
      WHERE cab.account_code = '10001'
    `);

    console.log('\n💰 Petty Cash Reconciliation:');
    console.log(`General Ledger Balance: $${pettyCash[0].general_ledger_balance}`);
    console.log(`Petty Cash Accounts Balance: $${pettyCash[0].petty_cash_accounts_balance}`);
    console.log(`Difference: $${pettyCash[0].difference}`);
    
    if (Math.abs(pettyCash[0].difference) > 0.01) {
      console.log('❌ WARNING: Petty cash accounts do not match general ledger!');
    } else {
      console.log('✅ Petty cash accounts reconciled');
    }

  } catch (error) {
    console.error('Error reconciling accounts:', error);
  } finally {
    await connection.end();
  }
}

reconcileAccounts();
```

---

## 📊 Implementation Priority

### Phase 1: Critical (Immediate)
1. ✅ **Implement database triggers** to sync journal entries → current_account_balances
2. ✅ **Fix petty cash transactions** to use double-entry accounting
3. ✅ **Create reconciliation script** to verify data integrity

### Phase 2: Important (1-2 weeks)
4. ⚠️ **Audit all existing transactions** to ensure journal entries exist
5. ⚠️ **Backfill missing journal entries** for historical transactions
6. ⚠️ **Update all petty cash user routes** to use double-entry

### Phase 3: Enhancement (1 month)
7. 📝 Create automated reconciliation job (runs daily)
8. 📝 Add validation to prevent transactions without journal entries
9. 📝 Create accounting audit trail report

---

## 🎯 Benefits of Complete Double-Entry Implementation

1. **Accuracy:** Every transaction affects two accounts, ensuring balance
2. **Audit Trail:** Complete history of all financial movements
3. **Compliance:** Follows GAAP (Generally Accepted Accounting Principles)
4. **Reporting:** Accurate financial statements (Balance Sheet, Income Statement, Trial Balance)
5. **Error Detection:** Imbalanced entries are immediately noticeable
6. **Scalability:** System can handle complex multi-entity accounting

---

## 📋 Summary

### Current Status:
- ✅ Student payments: Using double-entry
- ✅ Student invoices: Using double-entry
- ✅ Expenses: Using double-entry
- ❌ Petty cash: Using single-entry (NEEDS FIX)
- ⚠️ Journal entries not syncing to current_account_balances (NEEDS FIX)

### Required Changes:
1. Implement double-entry for all petty cash transactions
2. Create database triggers or service function to sync journal entries → balances
3. Create reconciliation script for data verification
4. Audit and backfill historical transactions

**Estimated Development Time:** 3-5 days for Phase 1 (critical fixes)

---

*Document created: October 28, 2025*
*Last updated: October 28, 2025*

