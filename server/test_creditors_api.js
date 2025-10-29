require('dotenv').config();
const axios = require('axios');

async function testCreditorsAPI() {
  console.log('🔍 Testing Creditors API Endpoint...\n');

  try {
    // You'll need to get a valid token first
    // For now, let's test if the route exists
    const baseURL = process.env.BASE_URL || 'http://localhost:5000';
    
    console.log(`Testing: ${baseURL}/api/reports/creditors`);
    console.log('Note: This will fail without auth, but we can see if the route exists\n');
    
    try {
      const response = await axios.get(`${baseURL}/api/reports/creditors`, {
        params: {
          boarding_house_id: 'all',
          status: 'all'
        }
      });
      
      console.log('✅ API Response received:');
      console.log('Summary:', response.data.summary);
      console.log('Creditors count:', response.data.creditors?.length);
      
    } catch (error) {
      if (error.response) {
        console.log(`❌ API Error: ${error.response.status} - ${error.response.statusText}`);
        console.log('Error message:', error.response.data?.message || error.response.data);
        
        if (error.response.status === 401) {
          console.log('\n💡 Route exists but requires authentication (expected)');
        }
      } else {
        console.log('❌ Request failed:', error.message);
        console.log('\n⚠️  Server might not be running on port 5000');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Also check the route file
console.log('📋 Checking routes file...\n');
const fs = require('fs');
const routesFile = './src/routes/reports.js';

if (fs.existsSync(routesFile)) {
  const content = fs.readFileSync(routesFile, 'utf8');
  
  if (content.includes('creditors')) {
    console.log('✅ /creditors route found in routes file');
    
    // Extract the route definition
    const lines = content.split('\n');
    const creditorLines = lines.filter(line => line.includes('creditors'));
    console.log('\nRoute definitions:');
    creditorLines.forEach(line => console.log('  ', line.trim()));
  } else {
    console.log('❌ /creditors route NOT found in routes file');
  }
} else {
  console.log('❌ Routes file not found');
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

testCreditorsAPI();
