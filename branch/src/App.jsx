import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/auth/Login';
import Dashboard from './pages/Dashboard';
import Rooms from './pages/Rooms';
import Students from './pages/students/Students';
import AddStudent from './pages/students/AddStudent';
import AssignRoom from './pages/students/AssignRoom';
import ViewStudent from './pages/students/ViewStudent';
import COA from './pages/accounting/COA';
import DashboardLayout from './components/layout/DashboardLayout';
import ChangePassword from './pages/settings/ChangePassword';

// Import student financials components
import Payments from './pages/student financials/Payments';
import OverduePayments from './pages/student financials/OverduePayments';
import RentLedger from './pages/student financials/RentLedger';

// Import expense components
import ExpensesList from './pages/expenses/ExpensesList';
import ExpenseCategories from './pages/expenses/ExpenseCategories';
import ExpenseReports from './pages/expenses/ExpenseReports';
import AddExpense from './pages/expenses/AddExpense';

// Import report components
import DebtorsReport from './pages/reports/DebtorsReport';
import CashflowReport from './pages/reports/CashflowReport';
import IncomeProjection from './pages/reports/IncomeProjection';
import IncomeStatement from './pages/reports/IncomeStatement';

// Import supplier components
import Suppliers from './pages/suppliers/Suppliers';
import AddSupplier from './pages/suppliers/AddSupplier';

// Import petty cash components
import PettyCash from './pages/petty cash/PettyCash';
import PettyCashLedger from './pages/petty cash/PettyCashLedger';

// Import budget components
import BudgetRequest from './pages/budget/BudgetRequest';
import BudgetApproval from './pages/budget/BudgetApproval';
import BudgetDashboard from './pages/budget/BudgetDashboard';

// Import expenditure components
import ExpenditureRequest from './pages/expenditure/ExpenditureRequest';
import ExpenditureApproval from './pages/expenditure/ExpenditureApproval';

// Import payment components
import RecordPayment from './pages/payments/RecordPayment';
import PaymentHistory from './pages/payments/PaymentHistory';

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return children;
};

const App = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Login />} />
      
      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="rooms" element={<Rooms />} />
        <Route path="students">
          <Route index element={<Students />} />
          <Route path="add" element={<AddStudent />} />
          <Route path="view/:studentId" element={<ViewStudent />} />
          <Route path="assign-room/:studentId" element={<AssignRoom />} />
        </Route>
        
        {/* Accounting Routes */}
        <Route path="accounting">
          <Route path="coa" element={<COA />} />
          <Route path="transactions" element={<div>Transactions Page</div>} />
          <Route path="journal" element={<div>Journal Entry Page</div>} />
          <Route path="ledger" element={<div>General Ledger Page</div>} />
        </Route>

        {/* Student Financials Routes */}
        <Route path="student-financials">
          <Route path="payments" element={<Payments />} />
          <Route path="payment-history" element={<Payments />} />
          <Route path="overdue" element={<OverduePayments />} />
          <Route path="rent-ledger" element={<RentLedger />} />
        </Route>

        {/* Payment Routes */}
        <Route path="payments">
          <Route path="record" element={<RecordPayment />} />
          <Route path="history" element={<PaymentHistory />} />
        </Route>

        {/* Expense Management Routes */}
        <Route path="expenses">
          <Route index element={<ExpensesList />} />
          <Route path="add" element={<AddExpense />} />
          <Route path="categories" element={<ExpenseCategories />} />
          <Route path="reports" element={<ExpenseReports />} />
        </Route>

        {/* Supplier Management Routes */}
        <Route path="suppliers">
          <Route index element={<Suppliers />} />
          <Route path="add" element={<AddSupplier />} />
          <Route path=":id/edit" element={<div>Edit Supplier Page</div>} />
        </Route>

        {/* Petty Cash Routes */}
        <Route path="petty-cash">
          <Route index element={<PettyCash />} />
          <Route path="ledger/:accountId" element={<PettyCashLedger />} />
        </Route>

        {/* Budget Management Routes */}
        <Route path="budget">
          <Route index element={<BudgetDashboard />} />
          <Route path="request" element={<BudgetRequest />} />
          <Route path="approval" element={<BudgetApproval />} />
        </Route>

        {/* Expenditure Management Routes */}
        <Route path="expenditure">
          <Route path="request" element={<ExpenditureRequest />} />
          <Route path="approval" element={<ExpenditureApproval />} />
        </Route>

        {/* Reports Routes */}
        <Route path="reports">
          <Route path="debtors" element={<DebtorsReport />} />
          <Route path="cashflow" element={<CashflowReport />} />
          <Route path="income-projection" element={<IncomeProjection />} />
          <Route path="income-statement" element={<IncomeStatement />} />
        </Route>

        {/* Settings Routes */}
        <Route path="change-password" element={<ChangePassword />} />
      </Route>

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;