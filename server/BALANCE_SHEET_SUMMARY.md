# Balance Sheet Corrections Summary

## Date: October 28, 2025

### Issues Fixed:

1. **Duplicate Student Enrollments Removed:**
   - **Anita Gwenda**: Removed enrollment 137 with $500 balance, kept enrollment 134 with $160
   - **Bellis Mapetere**: Removed enrollment 140 with $560 balance, kept enrollment 137 with $180

2. **Debtors Report Bug Fixed:**
   - Changed condition from `sab.current_balance > 0` to `sab.current_balance < 0`
   - Changed room JOIN from `JOIN rooms` to `LEFT JOIN rooms` to include students without room assignments

3. **Balance Sheet Controller Updated:**
   - Both debtors and prepayments now only include students with **active enrollments**
   - Matching the same logic used in the Debtors and Creditors reports
   - Ensures consistency across all financial reports

### Correct Figures (Active Enrollments Only):

#### **Student Debtors (Assets)**
- **Total Active Students with Debt**: 11 students
- **Total Amount Owed**: **$603.00**

**Breakdown:**
1. Kudzai Pemhiwa - $240.00
2. Dion sengamai - $80.00
3. Varaidzo Tafirei - $70.00
4. Fadzai Mhizha - $61.00
5. Chantelle Gora - $35.00
6. Shalom Gora - $35.00
7. Ropafadzo Masara - $30.00
8. Leona Dengu - $20.00
9. Emma Yoradin - $20.00
10. Bertha Majoni - $10.00
11. Rumbidzai Manyaora - $2.00

#### **Student Prepayments (Liabilities)**
- **Total Active Students with Prepayments**: 27 students
- **Total Prepayments**: **$3,376.00**

**Top Prepayments:**
1. Rachel Madembe - $540.00
2. Grace Vutika - $460.00
3. Paidamoyo Munyimi - $320.00
4. Sandra Chirinda - $280.00
5. Pelagia Gomakalila - $190.00

### Database Consistency:

#### Total Active Students: **56**
- Students Who Owe: 11 ($603.00)
- Students Who Prepaid: 27 ($3,376.00)
- Students With Zero Balance: 18

#### Net Student Balance: **$2,773.00** (Prepayments - Debtors)

### Why Some Balances Were Excluded:

The system correctly excludes:
- Old enrollment records that have been soft deleted
- Balance records where the enrollment_id no longer matches an active enrollment
- Students without active enrollments
- Enrollments that have expired

This ensures that only **currently active students** are reflected in financial reports.

### Files Modified:

1. `server/src/controllers/balanceSheetController.js`
   - Updated debtors query to only include active enrollments
   - Updated prepayments query to only include active enrollments

2. `server/src/controllers/reportsController.js`
   - Fixed `getDebtorsReport` query: changed `current_balance > 0` to `< 0`
   - Changed room JOIN to LEFT JOIN to include students without rooms

3. Database Updates:
   - Soft deleted enrollment 137 for Anita Gwenda (balance record also deleted)
   - Soft deleted enrollment 140 for Bellis Mapetere (balance record also deleted)

### Excel Export Files Created:

1. `student_balances_CORRECT_2025-10-28.xlsx` - All active students with balances
2. Contains breakdown by:
   - Student ID
   - Full Name
   - Status
   - Boarding House
   - Room
   - Enrollment ID
   - Current Balance
   - Balance Status (Owes/Prepaid/Zero)

---

**All reports (Debtors, Creditors, Balance Sheet) now use consistent logic and show matching figures!** ✅

