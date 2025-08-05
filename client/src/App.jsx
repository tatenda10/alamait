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
import AccountsPayable from './pages/accounting/AccountsPayable';
import Income from './pages/accounting/Payments';
import Students from './pages/students/Students';
import ViewStudent from './pages/students/ViewStudent';
import PettyCash from './pages/pettycash/pettycash';
import PettyCashReconciliation from './pages/pettycash/PettyCashReconciliation';
import PendingExpenses from './pages/pettycash/PendingExpenses';
import IncomeStatement from './pages/reports/IncomeStatement';
import DebtorsReport from './pages/reports/DebtorsReport';
import CreditorsReport from './pages/reports/CreditorsReport';
import Rooms from './pages/rooms/Rooms';
import AddRoom from './pages/rooms/AddRoom';
import ViewRoom from './pages/rooms/ViewRoom';
import EditRoom from './pages/rooms/EditRoom';
import Suppliers from './pages/suppliers/Suppliers';
import ViewSupplier from './pages/suppliers/ViewSupplier';
const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard/*" element={<DashboardLayout />}>
        <Route path="users" element={<UserManagement />} />
        <Route path="boarding-houses" element={<BoardingHouses />} />
        <Route path="rooms" element={<Rooms />} />
        <Route path="rooms/add" element={<AddRoom />} />
        <Route path="rooms/:id" element={<ViewRoom />} />
        <Route path="rooms/:id/edit" element={<EditRoom />} />
        <Route path="chart-of-accounts" element={<COA />} />
        <Route path="account-transactions/:accountId" element={<AccountTransactions />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="expenses/add" element={<AddExpense />} />
        <Route path="expenses/accounts-payable" element={<AccountsPayable />} />
        <Route path="income" element={<Income />} />
        <Route path="petty-cash" element={<PettyCash />} />
        <Route path="petty-cash/reconciliation" element={<PettyCashReconciliation />} />
        <Route path="petty-cash/reconciliation/:accountId" element={<PettyCashReconciliation />} />
        <Route path="petty-cash/pending-expenses" element={<PendingExpenses />} />
        <Route path="suppliers" element={<Suppliers />} />
        <Route path="suppliers/:id" element={<ViewSupplier />} />
        <Route path="students" element={<Students />} />
        <Route path="students/:studentId" element={<ViewStudent />} />
        <Route path="reports/income-statement" element={<IncomeStatement />} />
        <Route path="reports/debtors" element={<DebtorsReport />} />
        <Route path="reports/creditors" element={<CreditorsReport />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default App;