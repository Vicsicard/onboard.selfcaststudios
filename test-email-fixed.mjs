/**
 * Fixed test script for sending welcome emails
 * Handles the module system mismatch
 */

import dotenv from 'dotenv';
import pkg from './utils/email.js';
const { sendWelcomeEmail } = pkg;

// Load environment variables
dotenv.config({ path: '.env.local' });

// Test email recipient
const TEST_EMAIL = 'vicsicard@gmail.com';

async function testEmail() {
  try {
    console.log('======= TESTING WELCOME EMAIL =======');
    console.log(`Sending welcome email to: ${TEST_EMAIL}`);
    
    // Create test project details
    const projectDetails = {
      name: 'Test Project',
      projectId: 'test-' + Date.now(),
      projectCode: '9999' // Test project code
    };
    
    // Send the welcome email
    const result = await sendWelcomeEmail(
      'Test Client',
      TEST_EMAIL,
      projectDetails
    );
    
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', result.messageId);
    console.log('Response:', result.response || 'No response');
    
    return result;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    console.error(error.stack);
    throw error;
  }
}

// Run the test
testEmail()
  .then(() => console.log('🎉 Email test complete!'))
  .catch(error => {
    console.error(`❌ Email test failed: ${error.message}`);
    process.exit(1);
  });
