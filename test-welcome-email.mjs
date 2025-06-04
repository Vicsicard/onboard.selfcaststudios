/**
 * Test script to directly test the welcome email functionality
 */

// This needs to be an ES module to work with the email.js file
// Add "type": "module" to package.json or use .mjs extension

// Load environment variables
import dotenv from 'dotenv';
import { sendWelcomeEmail } from './utils/email.js';

dotenv.config({ path: '.env.local' });

// Test email recipient - replace with your email
const TEST_EMAIL = 'vicsicard@gmail.com';

async function testWelcomeEmail() {
  try {
    console.log('======= TESTING WELCOME EMAIL =======');
    console.log(`Sending welcome email to: ${TEST_EMAIL}`);
    
    // Create test project details
    const projectDetails = {
      name: 'Test Project',
      projectId: 'test-' + Date.now(),
      projectCode: '9999' // Test project code
    };
    
    // Send welcome email
    const result = await sendWelcomeEmail(
      'Test Client',
      TEST_EMAIL,
      projectDetails
    );
    
    console.log('✅ Welcome email sent successfully!');
    console.log(`Message ID: ${result.messageId}`);
    console.log(`Response: ${result.response || 'No response'}`);
    
    return result;
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    console.error(error.stack);
    throw error;
  }
}

// Run the test
testWelcomeEmail()
  .then(() => console.log('🎉 Welcome email test complete!'))
  .catch(error => {
    console.error(`❌ Welcome email test failed: ${error.message}`);
    process.exit(1);
  });
