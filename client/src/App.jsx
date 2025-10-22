import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import DashboardLayout from './components/DashboardLayout';
import UserManagement from './pages/user/UserManagement';
import BoardingHouses from './pages/boarding/BoardingHouses';
import COA from './pages/accounting/COA';
import AccountTransactions from './pages/accounting/AccountTransactions';
import Expenses from './pages/accounting/Expenses';
import AddExpense from './pages/accounting/AddExpense';
import EditExpense from './pages/accounting/EditExpense';
import AccountsPayable from './pages/accounting/AccountsPayable';
import Income from './pages/accounting/Payments';
import Students from './pages/students/Students';
import AddStudent from './pages/students/AddStudent';
import EditStudent from './pages/students/EditStudent';
import ViewStudent from './pages/students/ViewStudent';
import AssignRoom from './pages/students/AssignRoom';
import PettyCash from './pages/pettycash/Pettycash';
import PettyCashReconciliation from './pages/pettycash/PettyCashReconciliation';
import PendingExpenses from './pages/pettycash/PendingExpenses';
import Banking from './pages/banking/Banking';
import IncomeStatement from './pages/reports/IncomeStatement';
import CashflowReport from './pages/reports/CashflowReport';
import DebtorsReport from './pages/reports/DebtorsReport';
import CreditorsReport from './pages/reports/CreditorsReport';
import StudentPrepaymentsReport from './pages/reports/StudentPrepaymentsReport';
import ExpensesReport from './pages/reports/ExpensesReport';
import Rooms from './pages/rooms/Rooms';
import AddRoom from './pages/rooms/AddRoom';
import ViewRoom from './pages/rooms/ViewRoom';
import EditRoom from './pages/rooms/EditRoom';
import Suppliers from './pages/suppliers/Suppliers';
import ViewSupplier from './pages/suppliers/ViewSupplier';
import Reconciliation from './pages/accounting/Reconciliation';
import BankReconciliation from './pages/accounting/BankReconciliation';
import BankReconciliationDetail from './pages/accounting/BankReconciliationDetail';
import BalanceBDCD from './pages/accounting/BalanceBDCD';
import AccountLedger from './pages/accounting/AccountLedger';
import Applications from './pages/applications/Applications';
import TrialBalance from './pages/accounting/TrialBalance';
import ExpenditureRequests from './pages/expenses/ExpenditureRequests';
import BudgetRequests from './pages/expenses/BudgetRequests';
import BalanceSheet from './pages/reports/BalanceSheet';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard/*" element={<DashboardLayout />}>
        {/* Configuration Routes */}
        <Route path="users" element={<UserManagement />} />
        <Route path="boarding-houses" element={<BoardingHouses />} />
        <Route path="rooms" element={<Rooms />} />
        <Route path="rooms/add" element={<AddRoom />} />
        <Route path="rooms/:id" element={<ViewRoom />} />
        <Route path="rooms/:id/edit" element={<EditRoom />} />
        
        {/* Students Routes */}
        <Route path="students" element={<Students />} />
        <Route path="students/add" element={<AddStudent />} />
        <Route path="students/:studentId/edit" element={<EditStudent />} />
        <Route path="students/:studentId" element={<ViewStudent />} />
        <Route path="students/assign-room/:studentId" element={<AssignRoom />} />
        <Route path="students/enrollments" element={<div>Enrollments Page</div>} />
        <Route path="students/payment-schedules" element={<div>Payment Schedules Page</div>} />
        <Route path="students/payments" element={<div>Student Payments Page</div>} />
        
        {/* Applications Routes */}
        <Route path="applications" element={<Applications />} />
        
        {/* Accounting Routes */}
        <Route path="accounting/overview" element={<div>Accounting Overview Page</div>} />
        <Route path="chart-of-accounts" element={<COA />} />
        <Route path="account-transactions/:accountId" element={<AccountTransactions />} />
        <Route path="accounting/reconciliation" element={<Reconciliation />} />
        <Route path="accounting/bank-reconciliation" element={<BankReconciliation />} />
        <Route path="accounting/bank-reconciliation/:id" element={<BankReconciliationDetail />} />
        <Route path="accounting/balance-bd-cd" element={<BalanceBDCD />} />
        <Route path="accounting/account-ledger/:accountId/:periodId" element={<AccountLedger />} />
        <Route path="accounting/trial-balance" element={<TrialBalance />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="expenses/add" element={<AddExpense />} />
        <Route path="expenses/edit/:id" element={<EditExpense />} />
        <Route path="expenses/accounts-payable" element={<AccountsPayable />} />
        <Route path="expenses/expenditure-requests" element={<ExpenditureRequests />} />
        <Route path="expenses/budget-requests" element={<BudgetRequests />} />
        <Route path="income" element={<Income />} />
        <Route path="petty-cash" element={<PettyCash />} />
        <Route path="petty-cash/reconciliation" element={<PettyCashReconciliation />} />
        <Route path="petty-cash/reconciliation/:accountId" element={<PettyCashReconciliation />} />
        <Route path="petty-cash/pending-expenses" element={<PendingExpenses />} />
        <Route path="banking" element={<Banking />} />
        <Route path="suppliers" element={<Suppliers />} />
        <Route path="suppliers/:id" element={<ViewSupplier />} />
        
        {/* Reports Routes */}
        <Route path="reports/overview" element={<div>Reports Overview Page</div>} />
        <Route path="reports/income-statement" element={<IncomeStatement />} />
        <Route path="reports/cashflow" element={<CashflowReport />} />
        <Route path="reports/debtors" element={<DebtorsReport />} />
        <Route path="reports/creditors" element={<CreditorsReport />} />
        <Route path="reports/student-prepayments" element={<StudentPrepaymentsReport />} />
        <Route path="reports/expenses" element={<ExpensesReport />} />
        <Route path="reports/balance-sheet" element={<BalanceSheet />} />
        <Route path="reports/student-payments" element={<div>Student Payments Report Page</div>} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default App;