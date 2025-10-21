# Petty Cash Expense Import Plan - St Kilda

## Current System Analysis

### ✅ Petty Cash System Status
**System is USER-SPECIFIC and READY**

1. **Database Structure:**
   - `petty_cash_accounts` table exists with `user_id` field
   - `petty_cash_transactions` table exists
   - COA has Petty Cash account (10001)

2. **Users Available:**
   - sysadmin (id: 1)
   - tatenda (id: 2)
   - phoebe (id: 3)
   - admin (id: 4)

3. **Boarding Houses:**
   - St Kilda (id: 4) ✅ TARGET

4. **Existing Petty Cash Accounts:**
   - Two accounts exist but not for the specific user "Marko"

---

## Requirements from Image Data

### Expense Transactions to Import:
1. **Funds from Petty Cash** (Cash → Petty Cash transfers)
   - 2/9/2025: $500.00
   - 2/9/2025: $450.00
   - 2/9/2025: $90.00
   - 2/9/2025: $250.00
   - 2/9/2025: $265.00
   - 17/9/2025: $190.00

2. **Petty Cash Expenses:**
   - 2/9/2025: Security services - $450.00
   - 5/9/2025: Funds to petty cash Entertainment - $250.00
   - 2/9/2025: Water refill - $250.00
   - 3/9/2025: Firewood - $40.00
   - 3/9/2025: Gas - $192.00
   - 3/9/2025: Bin liners - $10.00
   - 3/9/2025: Mutsvairo - $4.00
   - 4/9/2025: Gas stove - $50.00
   - 4/9/2025: Fitting fee - $40.00
   - 10/9/2025: Water refill - $250.00
   - 10/9/2025: Emergency water leakage - $15.00
   - 18/9/2025: Water refill - $150.00
   - 18/9/2025: Firewood - $40.00

3. **Opening Balance:**
   - 1/9/2025: Balance C/F - $17.08 (via Owner's Equity)

4. **Exclude:**
   - Rental collected
   - Rental submitted

---

## Implementation Plan

### Step 1: Create User "Marko"
**Status:** NEEDED
- Create a new user account for Marko
- Assign to St Kilda boarding house
- Role: operations_officer or admin

### Step 2: Create Petty Cash Account for Marko
**Status:** NEEDED
- Create petty_cash_account linked to Marko's user_id
- Set boarding_house_id = 4 (St Kilda)
- Set beginning_balance = $17.08
- Account code: PC-MARKO-STK or similar

### Step 3: Record Opening Balance via Owner's Equity
**Accounting Entry (1/9/2025):**
```
Debit: Petty Cash (10001)      $17.08
Credit: Owner's Equity (30001)  $17.08
Description: Opening balance for Marko's petty cash - St Kilda
```

### Step 4: Record Cash to Petty Cash Transfers
**For each "Funds from Petty Cash" transaction:**
```
Debit: Petty Cash (10001)      $XXX
Credit: Cash (10002)            $XXX
Description: Cash transfer to petty cash - [date]
Transaction type: cash_inflow
```

### Step 5: Record Petty Cash Expenses
**For each expense:**
```
Debit: Expense Account (5XXXX)  $XXX
Credit: Petty Cash (10001)       $XXX
Description: [expense description]
Transaction type: expense
```

**Expense Account Mapping:**
- Security services → Security Expense (need COA code)
- Water refill → Water Expense (need COA code)
- Firewood → Utilities or Supplies
- Gas → Utilities Expense
- Bin liners → Cleaning Supplies
- Mutsvairo → (clarification needed)
- Gas stove → Equipment or Supplies
- Fitting fee → Repairs & Maintenance
- Emergency water leakage → Repairs & Maintenance
- Entertainment → Entertainment Expense

### Step 6: Update Petty Cash Account Balance
- Beginning balance: $17.08
- Add all inflows: $1,745.00
- Subtract all outflows: $1,741.00
- Final balance: $21.08 ✅ (matches image)

---

## Verification Checklist

- [ ] Marko user created
- [ ] Petty cash account created for Marko at St Kilda
- [ ] Opening balance journal entry posted
- [ ] All cash inflow transactions posted
- [ ] All expense transactions posted
- [ ] Petty cash account balance = $21.08
- [ ] petty_cash_transactions table updated
- [ ] current_account_balances recalculated
- [ ] Journal entries verified

---

## Is This Doable?

### ✅ YES - Here's why:

1. **User-specific petty cash system is in place** - We can create a dedicated account for Marko
2. **COA accounts exist** - Petty Cash (10001), Cash (10002), Owner's Equity exists
3. **Opening balance via Owner's Equity** - Standard accounting practice, fully supported
4. **Cash transfers supported** - System has cash_inflow transaction type
5. **Expenses supported** - System has expense transaction type
6. **Journal entries will be created** - Double-entry bookkeeping is maintained
7. **Balance tracking** - petty_cash_accounts.current_balance will be updated
8. **Date handling** - All dates can be backdated to match the image

### ⚠️ Considerations:

1. **Need to create user "Marko"** first
2. **Need to verify/create expense COA accounts** for all expense types
3. **Need clarification on "Mutsvairo"** - what type of expense is this?
4. **"Funds to petty cash Entertainment"** - Is this an expense or a transfer?

---

## Next Steps

1. Create user "Marko"
2. Verify all required expense accounts exist in COA
3. Create petty cash account for Marko
4. Create import script with all transactions
5. Run dry-run to verify
6. Apply changes
7. Verify final balance = $21.08

**Ready to proceed!**

