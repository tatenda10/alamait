const axios = require('axios');

async function testCashflowAPI() {
  try {
    console.log('Testing Cash Flow API...');
    
    // Test the cash flow API for September 2025
    const response = await axios.get('http://localhost:3001/api/reports/cashflow', {
      params: {
        start_date: '2025-09-01',
        end_date: '2025-09-30',
        boarding_house_id: 'all'
      }
    });
    
    console.log('Cash Flow Response:');
    console.log('Inflows:', response.data.inflows);
    console.log('Outflows:', response.data.outflows);
    console.log('Total Inflows:', response.data.totalInflows);
    console.log('Total Outflows:', response.data.totalOutflows);
    console.log('Net Cashflow:', response.data.netCashflow);
    
    // Check if student payments are showing
    const studentPayments = response.data.inflows.find(inflow => 
      inflow.category === 'Student Rent Payments'
    );
    
    if (studentPayments) {
      console.log('\n✅ Student Rent Payments found:', studentPayments);
    } else {
      console.log('\n❌ Student Rent Payments NOT found in inflows');
      console.log('Available inflow categories:', response.data.inflows.map(i => i.category));
    }
    
  } catch (error) {
    console.error('Error testing cash flow API:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testCashflowAPI();
