const axios = require('axios');

// Test script to verify the chart of accounts functionality
const BASE_URL = 'http://localhost:5000/api';

// Mock authentication token (you'll need to replace this with a real token)
const AUTH_TOKEN = 'your-auth-token-here';

const testChartOfAccountsCreation = async () => {
  try {
    console.log('Testing Chart of Accounts Creation...\n');
    
    // Test 1: Update existing boarding houses with predefined chart of accounts
    console.log('1. Testing update of existing boarding houses...');
    try {
      const response = await axios.post(
        `${BASE_URL}/boarding-houses/update-chart-of-accounts`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('✅ Successfully updated existing boarding houses:', response.data);
    } catch (error) {
      console.log('❌ Error updating existing boarding houses:', error.response?.data || error.message);
    }
    
    // Test 2: Get chart of accounts for a boarding house to verify accounts were created
    console.log('\n2. Testing chart of accounts retrieval...');
    try {
      const response = await axios.get(
        `${BASE_URL}/coa`,
        {
          headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`,
            'boarding-house-id': '1' // Test with boarding house ID 1
          }
        }
      );
      console.log('✅ Chart of accounts retrieved successfully');
      console.log('Number of accounts:', response.data.data?.length || 0);
      
      // Show some sample accounts
      if (response.data.data && response.data.data.length > 0) {
        console.log('\nSample accounts:');
        response.data.data.slice(0, 5).forEach(account => {
          console.log(`- ${account.code}: ${account.name} (${account.type})`);
        });
      }
    } catch (error) {
      console.log('❌ Error retrieving chart of accounts:', error.response?.data || error.message);
    }
    
    // Test 3: Create a new boarding house to test automatic chart creation
    console.log('\n3. Testing new boarding house creation with automatic chart of accounts...');
    try {
      const newBoardingHouse = {
        name: 'Test Boarding House',
        location: 'Test Location',
        admin_user_id: 1 // Assuming user ID 1 exists and is an admin
      };
      
      const response = await axios.post(
        `${BASE_URL}/boarding-houses`,
        newBoardingHouse,
        {
          headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('✅ New boarding house created successfully:', response.data);
      
      // Now check if chart of accounts was created for this new boarding house
      const newBoardingHouseId = response.data.id;
      const coaResponse = await axios.get(
        `${BASE_URL}/coa`,
        {
          headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`,
            'boarding-house-id': newBoardingHouseId.toString()
          }
        }
      );
      console.log(`✅ Chart of accounts automatically created for new boarding house (${coaResponse.data.data?.length || 0} accounts)`);
      
    } catch (error) {
      console.log('❌ Error creating new boarding house:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
};

console.log('Chart of Accounts Test Script');
console.log('==============================');
console.log('Note: Make sure to replace AUTH_TOKEN with a valid token before running this test.\n');

// Uncomment the line below to run the test (after setting a valid AUTH_TOKEN)
// testChartOfAccountsCreation();

module.exports = { testChartOfAccountsCreation };