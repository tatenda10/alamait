# 🧪 FRONTEND TEST SCRIPT - ALAMAIT BOARDING HOUSE MANAGEMENT SYSTEM

## Test Execution Template

| Test Name | Steps | Expected | Result (PASS/FAIL/N/A/Blocked) | Notes | Evidence Link/Path | Tester | Date | Module | Section |
|-----------|-------|----------|--------------------------------|-------|-------------------|--------|------|--------|---------|
| **AUTHENTICATION & LOGIN** |
| Login with Valid Credentials | - Navigate to login page (/auth/login)<br>- Enter valid username and password<br>- Click "Login" button<br>- Verify redirect to dashboard | User successfully logged in and redirected to dashboard | | | | | | Authentication | Login |
| Login with Invalid Credentials | - Navigate to login page<br>- Enter invalid username/password<br>- Click "Login" button<br>- Verify error message displays | Error message "Invalid credentials" displayed | | | | | | Authentication | Login |
| Login with Empty Fields | - Navigate to login page<br>- Leave username/password fields empty<br>- Click "Login" button<br>- Verify validation messages | Validation messages for required fields displayed | | | | | | Authentication | Login |
| Password Visibility Toggle | - Navigate to login page<br>- Enter password<br>- Click eye icon to toggle visibility<br>- Verify password shows/hides | Password visibility toggles correctly | | | | | | Authentication | Login |
| Logout Functionality | - From dashboard, click logout button in sidebar<br>- Verify redirect to login page<br>- Verify token removed from localStorage | User logged out and redirected to login page | | | | | | Authentication | Logout |
| **DASHBOARD & NAVIGATION** |
| Dashboard Load | - Login successfully<br>- Verify dashboard loads with all widgets<br>- Check navigation sidebar is visible | Dashboard displays with all components | | | | | | Dashboard | Main View |
| Sidebar Navigation | - Click on different sidebar sections (Students, Accounting, Reports)<br>- Verify correct content loads<br>- Check active section highlighting | Sidebar navigation works correctly with proper highlighting | | | | | | Dashboard | Navigation |
| Dynamic Sidebar Sections | - Click on "Students" section<br>- Verify students menu items appear<br>- Click on "Accounting" section<br>- Verify accounting menu items appear | Dynamic sidebar shows correct menu items for each section | | | | | | Dashboard | Navigation |
| **STUDENT MANAGEMENT** |
| Add New Student | - Navigate to Students → Add Student<br>- Fill in all required fields (name, email, phone, etc.)<br>- Select boarding house<br>- Submit form<br>- Verify student appears in student list | Student successfully created and visible in list | | | | | | Student Management | Student Registration |
| Student List Display | - Navigate to Students page<br>- Verify all students are displayed<br>- Check pagination works correctly<br>- Test search functionality by name | All students displayed with working search and pagination | | | | | | Student Management | Student List |
| Edit Student Information | - Navigate to Students page<br>- Click "Edit" on any student<br>- Modify student information<br>- Save changes<br>- Verify updated information displays | Student information updated successfully | | | | | | Student Management | Student Edit |
| View Student Details | - Navigate to Students page<br>- Click "View" on any student<br>- Verify all student details display correctly<br>- Check enrollment history | Student details page displays all information correctly | | | | | | Student Management | Student View |
| Assign Room to Student | - Navigate to Students → Assign Room<br>- Select student and available room<br>- Submit assignment<br>- Verify room status changes to occupied | Room successfully assigned to student | | | | | | Student Management | Room Assignment |
| Student Enrollment History | - Navigate to Students → Enrollment History<br>- Select a student<br>- Verify enrollment history displays<br>- Check payment records | Enrollment history displays correctly with payment records | | | | | | Student Management | Enrollment History |
| **ROOM MANAGEMENT** |
| Add New Room | - Navigate to Rooms → Add Room<br>- Fill in room details (number, capacity, boarding house)<br>- Submit form<br>- Verify room appears in room list | Room successfully created and visible in list | | | | | | Room Management | Room Creation |
| Room List Display | - Navigate to Rooms page<br>- Verify all rooms are displayed<br>- Check room status (available/occupied)<br>- Test filter by boarding house | All rooms displayed with correct status and filtering | | | | | | Room Management | Room List |
| Edit Room Information | - Navigate to Rooms page<br>- Click "Edit" on any room<br>- Modify room details<br>- Save changes<br>- Verify updated information | Room information updated successfully | | | | | | Room Management | Room Edit |
| View Room Details | - Navigate to Rooms page<br>- Click "View" on any room<br>- Verify room details and occupancy status<br>- Check assigned students | Room details display correctly with occupancy information | | | | | | Room Management | Room View |
| **BOARDING HOUSE MANAGEMENT** |
| Boarding House List | - Navigate to Boarding Houses page<br>- Verify all boarding houses are displayed<br>- Check house details and room counts | All boarding houses displayed with correct information | | | | | | Boarding House | House List |
| Add New Boarding House | - Navigate to Boarding Houses<br>- Click "Add New House"<br>- Fill in house details (name, address, etc.)<br>- Submit form<br>- Verify house appears in list | Boarding house successfully created | | | | | | Boarding House | House Creation |
| **EXPENSE MANAGEMENT** |
| Add New Expense | - Navigate to Expenses → Add Expense<br>- Fill in expense details (amount, description, category)<br>- Select boarding house<br>- Upload receipt (optional)<br>- Click "Auto" button for reference number<br>- Submit form<br>- Verify success modal appears | Expense created successfully with auto-generated reference | | | | | | Accounting | Expense Creation |
| Expense List Display | - Navigate to Expenses page<br>- Verify all expenses are displayed<br>- Check expense details and status<br>- Test search and filter functionality | All expenses displayed with working search/filter | | | | | | Accounting | Expense List |
| Edit Expense | - Navigate to Expenses page<br>- Click "Edit" on any expense<br>- Modify expense details<br>- Save changes<br>- Verify updated information | Expense information updated successfully | | | | | | Accounting | Expense Edit |
| Expense Success Modal | - Add a new expense<br>- Verify success modal appears after submission<br>- Check modal shows expense details<br>- Click "Close" button<br>- Verify modal closes and form resets | Success modal displays correctly and closes properly | | | | | | Accounting | Expense Modal |
| Accounts Payable | - Navigate to Expenses → Accounts Payable<br>- Verify pending payments are displayed<br>- Check payment due dates<br>- Test mark as paid functionality | Accounts payable list displays correctly with payment tracking | | | | | | Accounting | Accounts Payable |
| **PETTY CASH MANAGEMENT** |
| Petty Cash Balance Display | - Navigate to Petty Cash page<br>- Verify current balance is displayed<br>- Check transaction history<br>- Verify balance accuracy | Petty cash balance displays correctly | | | | | | Accounting | Petty Cash Balance |
| Add Cash to Petty Cash | - Navigate to Petty Cash page<br>- Click "Add Cash" button<br>- Enter amount and select date<br>- Select source account (Cash, CBZ Bank, CBZ Vault)<br>- Add description<br>- Submit form<br>- Verify balance updates | Cash successfully added to petty cash with proper accounting | | | | | | Accounting | Petty Cash Addition |
| Withdraw Cash from Petty Cash | - Navigate to Petty Cash page<br>- Click "Withdraw Cash" button<br>- Enter amount and select date<br>- Select destination account<br>- Add description<br>- Submit form<br>- Verify balance updates | Cash successfully withdrawn with proper accounting | | | | | | Accounting | Petty Cash Withdrawal |
| Add Petty Cash Expense | - Navigate to Petty Cash page<br>- Click "Add Expense" button<br>- Fill in expense details<br>- Select date<br>- Upload receipt<br>- Submit form<br>- Verify expense recorded | Petty cash expense recorded successfully | | | | | | Accounting | Petty Cash Expense |
| Petty Cash Transaction History | - Navigate to Petty Cash page<br>- Scroll to transaction history<br>- Verify all transactions are displayed<br>- Check transaction details and dates | Transaction history displays all petty cash transactions | | | | | | Accounting | Petty Cash History |
| Pending Petty Cash Expenses | - Navigate to Petty Cash → Pending Expenses<br>- Verify pending expenses are displayed<br>- Check approval workflow<br>- Test approve/reject functionality | Pending expenses list displays correctly with approval options | | | | | | Accounting | Petty Cash Pending |
| Petty Cash Reconciliation | - Navigate to Petty Cash → Reconciliation<br>- Verify reconciliation data displays<br>- Check balance calculations<br>- Test reconciliation process | Reconciliation page displays correctly with accurate calculations | | | | | | Accounting | Petty Cash Reconciliation |
| **BANKING SYSTEM** |
| Banking Dashboard | - Navigate to Banking page<br>- Verify account balances are displayed (Cash, CBZ Bank, CBZ Vault)<br>- Check balance accuracy | Banking dashboard displays all account balances correctly | | | | | | Banking | Balance Display |
| Add Balance to Account | - Navigate to Banking page<br>- Click "Add Balance" button<br>- Select target account<br>- Enter amount and description<br>- Select source account (Owner's Equity, Revenue, etc.)<br>- Select transaction date<br>- Submit form<br>- Verify balance updates | Balance successfully added with proper double-entry accounting | | | | | | Banking | Balance Addition |
| Transfer Between Accounts | - Navigate to Banking page<br>- Click "Transfer" button<br>- Select from and to accounts<br>- Enter transfer amount<br>- Add description and date<br>- Submit form<br>- Verify both account balances update | Transfer completed successfully with proper accounting entries | | | | | | Banking | Account Transfer |
| Set Opening Balance | - Navigate to Banking page<br>- Click "Opening Balance" button<br>- Select account<br>- Enter opening balance amount<br>- Select as-of date<br>- Submit form<br>- Verify balance updates | Opening balance set successfully | | | | | | Banking | Opening Balance |
| Banking Transaction History | - Navigate to Banking page<br>- Scroll to transaction history<br>- Verify all banking transactions are displayed<br>- Check transaction details and dates | Banking transaction history displays all transactions correctly | | | | | | Banking | Transaction History |
| **SUPPLIER MANAGEMENT** |
| Supplier List Display | - Navigate to Suppliers page<br>- Verify all suppliers are displayed<br>- Check supplier details and contact information<br>- Test search functionality | All suppliers displayed with working search | | | | | | Supplier Management | Supplier List |
| Add New Supplier | - Navigate to Suppliers page<br>- Click "Add Supplier" button<br>- Fill in supplier details (name, contact, address)<br>- Submit form<br>- Verify supplier appears in list | Supplier successfully created and visible in list | | | | | | Supplier Management | Supplier Creation |
| Edit Supplier Information | - Navigate to Suppliers page<br>- Click "Edit" on any supplier<br>- Modify supplier details<br>- Save changes<br>- Verify updated information | Supplier information updated successfully | | | | | | Supplier Management | Supplier Edit |
| View Supplier Details | - Navigate to Suppliers page<br>- Click "View" on any supplier<br>- Verify supplier details and payment history<br>- Check associated expenses | Supplier details display correctly with payment history | | | | | | Supplier Management | Supplier View |
| **PAYMENT MANAGEMENT** |
| Add New Payment | - Navigate to Payments → Add Payment<br>- Select student<br>- Enter payment amount<br>- Select payment method<br>- Add payment date<br>- Submit form<br>- Verify payment recorded | Payment successfully recorded with proper accounting | | | | | | Payment Management | Payment Creation |
| Payment History Display | - Navigate to Payments page<br>- Verify all payments are displayed<br>- Check payment details and status<br>- Test search by student | All payments displayed with working search functionality | | | | | | Payment Management | Payment History |
| **REPORTS SYSTEM** |
| Reports Overview | - Navigate to Reports → Overview<br>- Verify dashboard with key metrics displays<br>- Check quick access to all reports<br>- Test date range selection | Reports overview displays correctly with all metrics | | | | | | Reports | Overview |
| Income Statement Report | - Navigate to Reports → Income Statement<br>- Select date range<br>- Generate report<br>- Verify revenue and expense breakdown<br>- Test export to PDF/Excel | Income statement generates correctly with export functionality | | | | | | Reports | Income Statement |
| Cashflow Report | - Navigate to Reports → Cashflow<br>- Select date range<br>- Generate report<br>- Verify cash inflows and outflows<br>- Check period comparison | Cashflow report generates correctly with accurate data | | | | | | Reports | Cashflow |
| Debtors Report | - Navigate to Reports → Debtors<br>- Generate report<br>- Verify outstanding student payments<br>- Check payment due dates and aging | Debtors report displays outstanding payments correctly | | | | | | Reports | Debtors |
| Creditors Report | - Navigate to Reports → Creditors<br>- Generate report<br>- Verify outstanding supplier payments<br>- Check payment due dates and aging | Creditors report displays outstanding payments correctly | | | | | | Reports | Creditors |
| Expenses Report | - Navigate to Reports → Expenses<br>- Select date range and category<br>- Generate report<br>- Verify expense categorization<br>- Test export functionality | Expenses report generates correctly with proper categorization | | | | | | Reports | Expenses |
| Student Payments Report | - Navigate to Reports → Student Payments<br>- Select date range<br>- Generate report<br>- Verify payment history by student<br>- Check payment method analysis | Student payments report generates correctly with payment analysis | | | | | | Reports | Student Payments |
| **CHART OF ACCOUNTS** |
| COA Display | - Navigate to Accounting → Chart of Accounts<br>- Verify all accounts are displayed<br>- Check account hierarchy and structure<br>- Test search functionality | Chart of accounts displays correctly with proper hierarchy | | | | | | Accounting | Chart of Accounts |
| Add New Account | - Navigate to Chart of Accounts<br>- Click "Add Account"<br>- Fill in account details (name, code, type)<br>- Submit form<br>- Verify account appears in list | New account successfully created and visible | | | | | | Accounting | Account Creation |
| **BANK RECONCILIATION** |
| Bank Reconciliation | - Navigate to Accounting → Bank Reconciliation<br>- Verify reconciliation data displays<br>- Check bank statement vs system records<br>- Test reconciliation process | Bank reconciliation displays correctly with accurate data | | | | | | Accounting | Bank Reconciliation |
| **INCOME MANAGEMENT** |
| Income Display | - Navigate to Accounting → Income<br>- Verify income records are displayed<br>- Check income categorization<br>- Test search and filter functionality | Income records display correctly with working filters | | | | | | Accounting | Income Management |
| **USER MANAGEMENT** |
| User List Display | - Navigate to User Management<br>- Verify all users are displayed<br>- Check user roles and permissions<br>- Test search functionality | All users displayed with correct role information | | | | | | User Management | User List |
| Add New User | - Navigate to User Management<br>- Click "Add User"<br>- Fill in user details (name, email, role)<br>- Submit form<br>- Verify user appears in list | New user successfully created and visible | | | | | | User Management | User Creation |
| Edit User Permissions | - Navigate to User Management<br>- Click "Edit" on any user<br>- Modify user role and permissions<br>- Save changes<br>- Verify updated permissions | User permissions updated successfully | | | | | | User Management | User Edit |
| **RESPONSIVE DESIGN & UI** |
| Mobile View Testing | - Resize browser to mobile width<br>- Navigate through all major pages<br>- Verify sidebar collapses properly<br>- Test touch interactions | All pages display correctly on mobile with proper navigation | | | | | | UI/UX | Responsive Design |
| Tablet View Testing | - Resize browser to tablet width<br>- Navigate through all major pages<br>- Verify layout adapts correctly<br>- Test touch interactions | All pages display correctly on tablet with proper layout | | | | | | UI/UX | Responsive Design |
| Form Validation Testing | - Test all forms with empty required fields<br>- Test forms with invalid data formats<br>- Verify validation messages display<br>- Test form submission with valid data | All forms validate correctly with proper error messages | | | | | | UI/UX | Form Validation |
| Loading States | - Navigate between pages and observe loading states<br>- Test form submissions and verify loading indicators<br>- Check data loading spinners | Loading states display correctly for all operations | | | | | | UI/UX | Loading States |
| Error Handling | - Test network errors by disconnecting internet<br>- Test invalid API responses<br>- Verify error messages display properly<br>- Test error recovery | Error handling works correctly with user-friendly messages | | | | | | UI/UX | Error Handling |
| **FILE UPLOAD FUNCTIONALITY** |
| Receipt Upload | - Navigate to Add Expense page<br>- Click "Choose File" for receipt<br>- Select image file<br>- Verify file uploads successfully<br>- Test file preview | Receipt uploads work correctly with preview functionality | | | | | | File Management | Receipt Upload |
| Document Upload | - Navigate to Add Student page<br>- Click "Choose File" for documents<br>- Select PDF/image file<br>- Verify file uploads successfully<br>- Test file validation | Document uploads work correctly with proper validation | | | | | | File Management | Document Upload |
| File Size Validation | - Test uploading files larger than allowed limit<br>- Verify error message displays<br>- Test uploading allowed file types<br>- Test uploading disallowed file types | File size and type validation works correctly | | | | | | File Management | File Validation |
| **SEARCH & FILTER FUNCTIONALITY** |
| Student Search | - Navigate to Students page<br>- Enter search term in search box<br>- Verify filtered results display<br>- Test search by name, email, phone | Student search works correctly with accurate results | | | | | | Search/Filter | Student Search |
| Expense Filter | - Navigate to Expenses page<br>- Use date range filter<br>- Use category filter<br>- Use amount filter<br>- Verify filtered results | Expense filtering works correctly with all filter types | | | | | | Search/Filter | Expense Filter |
| Room Filter | - Navigate to Rooms page<br>- Filter by boarding house<br>- Filter by room status<br>- Filter by capacity<br>- Verify filtered results | Room filtering works correctly with all filter options | | | | | | Search/Filter | Room Filter |
| **EXPORT & PRINT FUNCTIONALITY** |
| Report Export | - Navigate to any report page<br>- Click "Export" button<br>- Select export format (PDF/Excel)<br>- Verify file downloads<br>- Check exported data accuracy | Report export works correctly with accurate data | | | | | | Export/Print | Report Export |
| Print Functionality | - Navigate to any report page<br>- Click "Print" button<br>- Verify print preview displays<br>- Test actual printing<br>- Check print formatting | Print functionality works correctly with proper formatting | | | | | | Export/Print | Print Reports |
| **NOTIFICATION SYSTEM** |
| Success Notifications | - Perform successful operations (add student, expense, etc.)<br>- Verify success toast notifications appear<br>- Check notification content and styling<br>- Test notification auto-dismiss | Success notifications display correctly with proper styling | | | | | | Notifications | Success Messages |
| Error Notifications | - Perform operations that should fail<br>- Verify error toast notifications appear<br>- Check error message content<br>- Test notification auto-dismiss | Error notifications display correctly with helpful messages | | | | | | Notifications | Error Messages |
| **NAVIGATION & ROUTING** |
| Direct URL Access | - Test accessing pages directly via URL<br>- Verify authentication redirects work<br>- Test protected route access<br>- Check 404 error handling | Direct URL access works correctly with proper authentication | | | | | | Navigation | URL Routing |
| Browser Back/Forward | - Navigate through multiple pages<br>- Use browser back button<br>- Use browser forward button<br>- Verify page state is maintained | Browser navigation works correctly with maintained state | | | | | | Navigation | Browser Navigation |
| **PERFORMANCE TESTING** |
| Page Load Times | - Test initial page load times<br>- Test navigation between pages<br>- Test data loading times<br>- Verify acceptable performance | All pages load within acceptable time limits | | | | | | Performance | Load Times |
| Large Data Handling | - Test with large datasets (many students, expenses)<br>- Verify pagination works correctly<br>- Test search performance with large data<br>- Check memory usage | System handles large datasets efficiently | | | | | | Performance | Data Handling |

---

## 📋 **TEST EXECUTION INSTRUCTIONS**

### **Pre-Test Setup:**
1. Ensure the client application is running on the development server
2. Have test data ready (sample students, expenses, suppliers, etc.)
3. Prepare test files for upload (images, PDFs)
4. Clear browser cache and cookies before testing
5. Use a consistent browser for all tests

### **Test Execution Guidelines:**
1. **Execute tests in order** - Some tests depend on previous test results
2. **Document all results** - Mark PASS/FAIL/N/A/Blocked for each test
3. **Take screenshots** - Capture evidence for failed tests
4. **Record detailed notes** - Document any issues or observations
5. **Test on multiple browsers** - Chrome, Firefox, Safari, Edge
6. **Test responsive design** - Mobile, tablet, desktop views

### **Test Data Requirements:**
- Sample boarding houses
- Sample rooms with different statuses
- Sample students with complete information
- Sample suppliers with contact details
- Sample expenses with receipts
- Sample payments and transactions
- Test files for upload (images, PDFs)

### **Browser Compatibility:**
- **Chrome** (Primary)
- **Firefox** (Secondary)
- **Safari** (Mac users)
- **Edge** (Windows users)

### **Device Testing:**
- **Desktop** (1920x1080, 1366x768)
- **Tablet** (768x1024, 1024x768)
- **Mobile** (375x667, 414x896)

---

## 🎯 **TESTING PRIORITIES**

### **High Priority (Critical Functions):**
1. Authentication & Login
2. Student Management (Add, Edit, View)
3. Expense Management (Add, Edit, List)
4. Petty Cash Operations (Add, Withdraw, Expenses)
5. Banking Operations (Add Balance, Transfer)
6. Payment Processing

### **Medium Priority (Important Functions):**
1. Room Management
2. Supplier Management
3. Reports Generation
4. File Uploads
5. Search & Filter Functions

### **Low Priority (Nice-to-Have Functions):**
1. Export/Print Functions
2. Advanced UI Features
3. Performance Optimizations
4. Responsive Design Details

---

**📅 Test Script Version:** 1.0  
**📅 Last Updated:** [Current Date]  
**👤 Created By:** [Tester Name]  
**🎯 Target Application:** AlamaIT Boarding House Management System - Client Frontend
