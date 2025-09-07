const express = require('express');
const { getDashboardData } = require('./src/controllers/dashboardController');
const { authenticate } = require('./src/middleware/auth');

const app = express();
app.use(express.json());

// Test route
app.get('/test-dashboard', authenticate, getDashboardData);

console.log('✅ Dashboard controller and middleware loaded successfully');
console.log('✅ Route /test-dashboard is registered');
console.log('✅ Server ready for testing');
