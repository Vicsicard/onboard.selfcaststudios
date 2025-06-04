/**
 * Production Email Test Script
 * 
 * This script tests the email sending functionality in the production environment
 * and logs detailed information about the process to help diagnose issues.
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });
const nodemailer = require('nodemailer');
const fs = require('fs').promises;

// Test email recipient
const TEST_EMAIL = 'vicsicard@gmail.com';
const LOG_FILE = './email-test-log.txt';

// Log function that writes to both console and file
async function log(message, isError = false) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  
  if (isError) {
    console.error(logMessage);
  } else {
    console.log(logMessage);
  }
  
  try {
    await fs.appendFile(LOG_FILE, logMessage + '\n');
  } catch (err) {
    console.error(`Failed to write to log file: ${err.message}`);
  }
}

// Create and test SMTP connection
async function testSMTPConnection() {
  try {
    await log('======= PRODUCTION EMAIL TEST =======');
    await log(`Environment: ${process.env.NODE_ENV}`);
    await log(`Server: ${process.env.EMAIL_HOST}:${process.env.EMAIL_PORT}`);
    await log(`Username: ${process.env.EMAIL_USER}`);
    await log(`Secure: ${process.env.EMAIL_SECURE}`);
    await log(`Auth Method: ${process.env.EMAIL_AUTH_METHOD || 'Not specified'}`);
    
    // Create transporter with detailed logging
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT, 10),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      authMethod: process.env.EMAIL_AUTH_METHOD || 'LOGIN',
      tls: {
        rejectUnauthorized: false
      },
      debug: true,
      logger: true
    });
    
    // Verify connection configuration
    await log('Verifying connection to mail server...');
    try {
      await transporter.verify();
      await log('✅ Mail server connection verified!');
    } catch (error) {
      await log(`❌ Mail server connection failed: ${error.message}`, true);
      await log(JSON.stringify(error, null, 2), true);
      throw error;
    }
    
    // Send a test email
    await log('Sending test email...');
    const info = await transporter.sendMail({
      from: `"Self Cast Studios" <${process.env.EMAIL_USER}>`,
      to: TEST_EMAIL,
      cc: 'newclient@selfcaststudios.com',
      subject: 'SelfCast Onboard - PRODUCTION SMTP Test',
      text: 'This is a test email from the SelfCast Onboard system on Render.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>PRODUCTION SMTP Test Email</h2>
          <p>This is a test email from the SelfCast Onboard system running on Render.</p>
          <p>If you're seeing this, the SMTP configuration is working correctly in production.</p>
          <p>Configuration used:</p>
          <ul>
            <li>Host: ${process.env.EMAIL_HOST}</li>
            <li>Port: ${process.env.EMAIL_PORT}</li>
            <li>Secure: ${process.env.EMAIL_SECURE}</li>
            <li>Auth Method: ${process.env.EMAIL_AUTH_METHOD || 'Not specified'}</li>
          </ul>
          <p>Time sent: ${new Date().toISOString()}</p>
          <p>Environment: ${process.env.NODE_ENV}</p>
        </div>
      `
    });
    
    await log('✅ Test email sent!');
    await log(`Message ID: ${info.messageId}`);
    await log(`Response: ${info.response}`);
    
    // Test the welcome email function
    await log('Testing welcome email function...');
    const { sendWelcomeEmail } = require('./utils/email');
    
    const welcomeInfo = await sendWelcomeEmail(
      'Test Client', 
      TEST_EMAIL, 
      {
        name: 'Test Project',
        projectId: 'test-project',
        projectCode: '1234'
      }
    );
    
    await log('✅ Welcome email function test complete!');
    await log(`Welcome email Message ID: ${welcomeInfo.messageId}`);
    await log(`Welcome email Response: ${welcomeInfo.response}`);
    
    return info;
  } catch (error) {
    await log(`❌ Error in SMTP test: ${error.message}`, true);
    await log(error.stack, true);
    throw error;
  }
}

// Run the test
testSMTPConnection()
  .then(() => log('🎉 SMTP test complete!'))
  .catch(async error => {
    await log(`❌ SMTP test failed: ${error.message}`, true);
    process.exit(1);
  });
