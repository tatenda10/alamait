const axios = require('axios');

async function testBedsEndpoint() {
  try {
    console.log('🔍 Testing beds endpoint...');
    
    // Test the endpoint that the client is calling
    const response = await axios.get('http://localhost:5000/api/beds/room/5', {
      headers: {
        'Authorization': 'Bearer test-token' // This might fail due to auth, but let's see
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    
  } catch (error) {
    console.error('Error testing endpoint:', error.response?.status, error.response?.data || error.message);
    
    // Try without authentication
    try {
      console.log('\n🔍 Trying public endpoint...');
      const publicResponse = await axios.get('http://localhost:5000/api/beds/room/5/public');
      console.log('Public endpoint response:', publicResponse.data);
    } catch (publicError) {
      console.error('Public endpoint also failed:', publicError.message);
    }
  }
}

testBedsEndpoint();
