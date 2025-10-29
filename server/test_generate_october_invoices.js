require('dotenv').config();
const axios = require('axios');

async function testGenerateOctoberInvoices() {
  console.log('🔄 Testing October Invoice Generation...\n');

  try {
    // First, login to get a token
    console.log('1. Logging in...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      username: 'admin',
      password: 'admin123' // Update with your actual credentials
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful\n');

    // Generate October 2025 invoices
    console.log('2. Generating October 2025 invoices...');
    const response = await axios.post(
      'http://localhost:3001/api/monthly-invoices/generate',
      {
        invoice_month: '2025-10',
        invoice_date: '2025-10-01',
        description_prefix: 'Monthly Rent'
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    if (response.data.success) {
      console.log('✅ Invoices generated successfully!\n');
      console.log('📊 Summary:');
      console.log(`  Month: ${response.data.data.invoice_month}`);
      console.log(`  Total Invoices: ${response.data.data.total_invoices}`);
      console.log(`  Total Amount: $${response.data.data.total_amount.toFixed(2)}\n`);

      console.log('📋 Generated Invoices:');
      response.data.data.invoices.forEach((invoice, index) => {
        console.log(`  ${index + 1}. ${invoice.student_name} - ${invoice.room_name} - $${invoice.amount}`);
      });

      if (response.data.data.errors && response.data.data.errors.length > 0) {
        console.log('\n⚠️ Errors:');
        response.data.data.errors.forEach((error, index) => {
          console.log(`  ${index + 1}. ${error.student_name}: ${error.error}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testGenerateOctoberInvoices();

