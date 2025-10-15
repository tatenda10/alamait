require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const routes = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/logger');
const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');
const branchAuthRoutes = require('./routes/branchAuth');
const path = require('path');
const paymentRoutes = require('./routes/payment');
const rentLedgerRoutes = require('./routes/rentLedger');
const expenseRoutes = require('./routes/expense');
const reportsRoutes = require('./routes/reports');
const checkoutRoutes = require('./routes/checkout');
const dashboardRoutes = require('./routes/dashboard');
const boardingHouseRoutes = require('./routes/boardingHouses');
const supplierRoutes = require('./routes/suppliers');
const pettyCashRoutes = require('./routes/pettyCash');
const pettyCashAuthRoutes = require('./routes/pettyCashAuth');
const pettyCashUserRoutes = require('./routes/pettyCashUser');
const pettyCashAdminRoutes = require('./routes/pettyCashAdmin');
const pendingPettyCashRoutes = require('./routes/pendingPettyCash');
const incomeStatementRoutes = require('./routes/incomeStatement');
const accountsPayableRoutes = require('./routes/accountsPayable');
const supplierPaymentRoutes = require('./routes/supplierPayment');
const bankingRoutes = require('./routes/banking');
const trialBalanceRoutes = require('./routes/trialBalance');
const bedsRoutes = require('./routes/beds');
const applicationRoutes = require('./routes/applications');
const monthlyInvoiceRoutes = require('./routes/monthlyInvoices');
const revenueRoutes = require('./routes/revenue');
const budgetRequestRoutes = require('./routes/budgetRequests');
const expenditureRequestRoutes = require('./routes/expenditureRequests');
const branchPaymentRoutes = require('./routes/branchPayment');
const testEmailRoutes = require('./routes/testEmail');

// Enable CORS
app.use(cors({
  origin: ['http://localhost:5173','http://192.168.100.42:5173','http://192.168.56.1:5173','http://192.168.100.24:5173','http://localhost:5174','http://localhost:3002'], // Vite's default port + petty cash app
  credentials: true
}));

// Serve static files from uploads directory
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Register boarding house routes first
app.use('/api/boarding-house/auth', branchAuthRoutes);
app.use('/api/boarding-houses', boardingHouseRoutes);
// Then register other routes
app.use('/api', routes);
app.use('/api/payments', paymentRoutes);
app.use('/api/rent-ledger', rentLedgerRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/petty-cash', pettyCashRoutes);
app.use('/api/pettycash/auth', pettyCashAuthRoutes);
app.use('/api/pettycash', pettyCashUserRoutes);
app.use('/api/petty-cash-admin', pettyCashAdminRoutes);
app.use('/api/pending-petty-cash', pendingPettyCashRoutes);
app.use('/api/income-statement', incomeStatementRoutes);
app.use('/api/accounts-payable', accountsPayableRoutes);
app.use('/api/supplier-payments', supplierPaymentRoutes);
app.use('/api/banking', bankingRoutes);
app.use('/api/trial-balance', trialBalanceRoutes);
app.use('/api/beds', bedsRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/monthly-invoices', monthlyInvoiceRoutes);
app.use('/api/revenue', revenueRoutes);
app.use('/api/budget-requests', budgetRequestRoutes);
app.use('/api/expenditure-requests', expenditureRequestRoutes);
app.use('/api/branch-payments', branchPaymentRoutes);
app.use('/api/test-email', testEmailRoutes);

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Alamait Boarding School API',
    version: '1.0.0',
    description: 'API documentation for the multi-tenant boarding school management system',
  },
  servers: [
    { url: 'http://localhost:5000/api', description: 'Local server' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [{ bearerAuth: [] }],
};

const options = {
  swaggerDefinition,
  apis: ['./src/routes/*.js', './src/controllers/*.js'],
};
const swaggerSpec = swaggerJSDoc(options);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(errorHandler);
 
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});

module.exports = app;