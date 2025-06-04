/**
 * Test script to simulate the onboarding form submission API call
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

// Test data - similar to what the form would submit
const testData = {
  clientName: 'Test Client',
  clientEmail: 'vicsicard@gmail.com', // Your email for testing
  projectName: 'Test Project ' + Date.now(),
  phoneNumber: '555-123-4567',
  workshopResponses: {
    successDefinition: 'Test success definition',
    contentGoals: 'Test content goals',
    challenges: 'Test challenges',
    interests: 'Test interests'
  }
};

async function testOnboardingApi() {
  try {
    console.log('======= TESTING ONBOARDING API =======');
    console.log(`Submitting test data to API:`, JSON.stringify(testData, null, 2));
    
    // Make the API call directly to the local endpoint
    const response = await fetch('http://localhost:3000/api/submit-onboarding', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'API returned error');
    }
    
    console.log('✅ API response successful:', data);
    console.log(`Project ID: ${data.projectId}`);
    console.log(`Project Code: ${data.projectCode}`);
    
    // Wait for email to be sent (since it happens after API response)
    console.log('Waiting 10 seconds for email to be sent...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    console.log('Test complete! Check your email inbox for the welcome email.');
    
    return data;
  } catch (error) {
    console.error('❌ Error testing onboarding API:', error);
    console.error(error.stack);
    throw error;
  }
}

// Run the test
testOnboardingApi()
  .then(() => console.log('🎉 Onboarding API test complete!'))
  .catch(error => {
    console.error(`❌ Onboarding API test failed: ${error.message}`);
    process.exit(1);
  });
