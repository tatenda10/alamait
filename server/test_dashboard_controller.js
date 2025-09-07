const { getDashboardData } = require('./src/controllers/dashboardController');

console.log('🧪 Testing dashboard controller...');

// Mock request and response objects
const mockReq = {
  user: {
    id: 1,
    boarding_house_id: 4,
    role: 'admin'
  }
};

const mockRes = {
  json: (data) => {
    console.log('✅ Dashboard data response:', JSON.stringify(data, null, 2));
  },
  status: (code) => {
    console.log('📊 Response status:', code);
    return {
      json: (data) => {
        console.log('❌ Error response:', data);
      }
    };
  }
};

// Test the controller
getDashboardData(mockReq, mockRes)
  .then(() => {
    console.log('✅ Dashboard controller test completed');
  })
  .catch((error) => {
    console.error('❌ Dashboard controller test failed:', error);
  });
