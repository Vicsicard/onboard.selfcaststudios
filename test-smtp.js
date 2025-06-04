/**
 * Test SMTP Connection for SelfCast Onboard
 * 
 * This script tests the SMTP connection with the current configuration
 * to diagnose email sending issues.
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });
const nodemailer = require('nodemailer');

// Test email recipient
const TEST_EMAIL = 'vicsicard@gmail.com';

// Create and test SMTP connection
async function testSMTPConnection() {
  try {
    console.log('Testing SMTP connection with current configuration...');
    console.log(`Server: ${process.env.EMAIL_HOST}:${process.env.EMAIL_PORT}`);
    console.log(`Username: ${process.env.EMAIL_USER}`);
    console.log(`Secure: ${process.env.EMAIL_SECURE}`);
    console.log(`Auth Method: ${process.env.EMAIL_AUTH_METHOD || 'Not specified'}`);
    
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
    console.log('Verifying connection to mail server...');
    try {
      await transporter.verify();
      console.log('✅ Mail server connection verified!');
    } catch (error) {
      console.error('❌ Mail server connection failed:', error.message);
      console.error(error);
      throw error;
    }
    
    // Send a test email
    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: `"Self Cast Studios" <${process.env.EMAIL_USER}>`,
      to: TEST_EMAIL,
      cc: 'newclient@selfcaststudios.com',
      subject: 'SelfCast Onboard - SMTP Test',
      text: 'This is a test email from the SelfCast Onboard system.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>SMTP Test Email</h2>
          <p>This is a test email from the SelfCast Onboard system.</p>
          <p>If you're seeing this, the SMTP configuration is working correctly.</p>
          <p>Configuration used:</p>
          <ul>
            <li>Host: ${process.env.EMAIL_HOST}</li>
            <li>Port: ${process.env.EMAIL_PORT}</li>
            <li>Secure: ${process.env.EMAIL_SECURE}</li>
            <li>Auth Method: ${process.env.EMAIL_AUTH_METHOD || 'Not specified'}</li>
          </ul>
          <p>Time sent: ${new Date().toISOString()}</p>
        </div>
      `
    });
    
    console.log('✅ Test email sent!');
    console.log('Message ID:', info.messageId);
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    
    return info;
  } catch (error) {
    console.error('❌ Error in SMTP test:', error.message);
    throw error;
  }
}

// Run the test
testSMTPConnection()
  .then(() => console.log('🎉 SMTP test complete!'))
  .catch(error => {
    console.error('❌ SMTP test failed:', error);
    process.exit(1);
  });
