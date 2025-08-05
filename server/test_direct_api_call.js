const axios = require('axios');

async function testDirectAPICall() {
  try {
    console.log('Testing direct API call to accounts payable endpoint...\n');
    
    // You'll need to replace this with a valid JWT token
    // For testing, you can get this from the browser's localStorage or network tab
    const token = 'YOUR_JWT_TOKEN_HERE';
    
    const response = await axios.get('http://localhost:5000/api/accounts-payable', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('API Response Status:', response.status);
    console.log('API Response Data:', JSON.stringify(response.data, null, 2));
    
    if (response.data?.data) {
      console.log(`\nTotal records returned: ${response.data.data.length}`);
      
      // Check for petty cash items
      const pettyCashItems = response.data.data.filter(item => 
        item.description && item.description.toLowerCase().includes('petty cash')
      );
      
      if (pettyCashItems.length > 0) {
        console.log('\n🚨 FOUND PETTY CASH ITEMS IN ACCOUNTS PAYABLE:');
        pettyCashItems.forEach((item, index) => {
          console.log(`${index + 1}. ID: ${item.id}, Description: ${item.description}, Payment Method: ${item.payment_method}`);
        });
      } else {
        console.log('\n✅ No petty cash items found in accounts payable');
      }
      
      // Check payment methods
      const paymentMethods = [...new Set(response.data.data.map(item => item.payment_method))];
      console.log('\nPayment methods in response:', paymentMethods);
    }
    
  } catch (error) {
    console.error('Error calling API:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

console.log('To use this test:');
console.log('1. Open your browser and go to the expenses page');
console.log('2. Open Developer Tools (F12)');
console.log('3. Go to Application/Storage tab and find localStorage');
console.log('4. Copy the "token" value');
console.log('5. Replace YOUR_JWT_TOKEN_HERE in this file with that token');
console.log('6. Run: node test_direct_api_call.js\n');

// Uncomment the line below and add your token to run the test
// testDirectAPICall();