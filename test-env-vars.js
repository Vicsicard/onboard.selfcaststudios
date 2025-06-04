/**
 * Test script to print all environment variables
 * This will help us debug the email configuration
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

console.log('======= ENVIRONMENT VARIABLES =======');
console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '******' : 'not set');
console.log('EMAIL_SECURE:', process.env.EMAIL_SECURE);
console.log('EMAIL_AUTH_METHOD:', process.env.EMAIL_AUTH_METHOD);
console.log('USE_TEST_EMAIL:', process.env.USE_TEST_EMAIL);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Create a simple test to log the actual values used in the email.js file
const getEmailConfig = () => {
  const host = process.env.EMAIL_HOST || 'smtp.oxcs.bluehost.com';
  const port = parseInt(process.env.EMAIL_PORT || '587', 10);
  const secure = process.env.EMAIL_SECURE === 'true';
  const user = process.env.EMAIL_USER || 'defense@selfcaststudios.com';
  const pass = process.env.EMAIL_PASSWORD;
  const authMethod = process.env.EMAIL_AUTH_METHOD || 'LOGIN';
  
  return {
    host,
    port,
    secure,
    user,
    authMethod
  };
};

console.log('======= EMAIL CONFIG USED =======');
console.log(getEmailConfig());
