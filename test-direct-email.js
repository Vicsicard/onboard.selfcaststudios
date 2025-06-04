/**
 * Test script to directly test the welcome email function
 * This uses CommonJS style to avoid ES module issues
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Test email recipient - replace with your email
const TEST_EMAIL = 'vicsicard@gmail.com';

// We need to use CommonJS style require for the email module
// First, let's create a simple wrapper function that will call the sendWelcomeEmail function
async function testWelcomeEmail() {
  try {
    console.log('======= TESTING WELCOME EMAIL DIRECTLY =======');
    console.log(`Sending welcome email to: ${TEST_EMAIL}`);
    
    // Create test project details
    const projectDetails = {
      name: 'Test Project',
      projectId: 'test-' + Date.now(),
      projectCode: '9999' // Test project code
    };
    
    // We need to use child_process to run a separate Node.js process with ES modules
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execPromise = promisify(exec);
    
    // Create a temporary script that will run with ES modules
    const fs = require('fs');
    const tempScript = `
    import { sendWelcomeEmail } from './utils/email.js';
    
    async function runTest() {
      try {
        const result = await sendWelcomeEmail(
          'Test Client',
          '${TEST_EMAIL}',
          {
            name: 'Test Project',
            projectId: 'test-${Date.now()}',
            projectCode: '9999'
          }
        );
        
        console.log('Email sent successfully!');
        console.log('Message ID:', result.messageId);
        console.log('Response:', result.response || 'No response');
        
        return result;
      } catch (error) {
        console.error('Error sending email:', error);
        throw error;
      }
    }
    
    runTest().catch(console.error);
    `;
    
    fs.writeFileSync('temp-email-test.mjs', tempScript);
    
    console.log('Running email test in ES module context...');
    const { stdout, stderr } = await execPromise('node --experimental-modules temp-email-test.mjs');
    
    console.log('Output:', stdout);
    
    if (stderr) {
      console.error('Errors:', stderr);
    }
    
    // Clean up
    fs.unlinkSync('temp-email-test.mjs');
    
    console.log('Test complete! Check your email inbox for the welcome email.');
    
  } catch (error) {
    console.error('❌ Error testing welcome email:', error);
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
