// Script to resend welcome email to a specific user
require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

// Create our own email sending function since the module uses ES imports
const nodemailer = require('nodemailer');

// Create reusable transporter using Bluehost SMTP or fallback to test account
async function createTransporter() {
  // Check if we should use test email
  const useTestEmail = process.env.USE_TEST_EMAIL === 'true';
  
  console.log(`Using test email: ${useTestEmail}`);
  
  // Use test email account for development
  if (useTestEmail) {
    console.log('Using test email account for development');
    try {
      const testAccount = await nodemailer.createTestAccount();
      
      // Create a transporter using the test account
      return nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
    } catch (error) {
      console.error('Failed to create test email account:', error);
      // Fall back to console logging if test account creation fails
      return {
        sendMail: (mailOptions) => {
          console.log('Email would have been sent with the following options:', mailOptions);
          return Promise.resolve({ messageId: 'test-message-id' });
        }
      };
    }
  }
  
  // Use production email settings
  // Use Bluehost-specific configuration
  const host = process.env.EMAIL_HOST || 'mail.selfcaststudios.com';
  const port = parseInt(process.env.EMAIL_PORT || '465', 10);
  const secure = process.env.EMAIL_SECURE === 'true';
  
  // Create Bluehost-specific email configuration
  const config = {
    host: host,
    port: port,
    secure: secure, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER || 'defense@selfcaststudios.com',
      pass: process.env.EMAIL_PASSWORD
    },
    tls: {
      // Do not fail on invalid certs
      rejectUnauthorized: false
    },
    debug: true // Enable debug output
  };
  
  console.log(`Using email configuration for host: ${host}`);
  return nodemailer.createTransport(config);
}

// Send welcome/confirmation email
async function sendWelcomeEmail(clientName, clientEmail, projectDetails) {
  try {
    console.log(`Attempting to send welcome email to ${clientEmail}`);
    const transporter = await createTransporter();
    
    // Verify connection configuration
    transporter.verify(function(error, success) {
      if (error) {
        console.error('SMTP connection verification failed:', error);
      } else {
        console.log('SMTP server is ready to take our messages');
      }
    });
    
    const mailOptions = {
      from: '"Self Cast Studios" <defense@selfcaststudios.com>',
      to: clientEmail,
      cc: 'newclient@selfcaststudios.com',
      subject: "Welcome to Self Cast Studios!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome, ${clientName}!</h2>
          <p>Thank you for joining Self Cast Studios. Your project "${projectDetails.name}" has been created.</p>
          
          <p>You can access your project dashboard at any time using your email address: ${clientEmail}</p>
          <p>We've created an account for you with the following details:</p>
          <ul>
            <li><strong>Login Email:</strong> ${clientEmail}</li>
            <li><strong>Project ID:</strong> ${projectDetails.projectId}</li>
          </ul>
          
          <a href="https://clients.selfcaststudios.com/" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 15px;">Access Your Dashboard</a>
          
          <div style="background-color: #f9f9f9; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Important Timeline Information:</strong></p>
            <p style="margin: 10px 0 0;">Please note that your website and new content will not be available until after the workshop and creative process is complete. This typically takes about 14 days after your workshop is completed.</p>
          </div>
          
          <p style="margin-top: 20px;">If you have any questions, please don't hesitate to contact us.</p>
          <p>Best regards,<br>The Self Cast Studios Team</p>
        </div>
      `
    };
    
    console.log('Sending email with the following options:', {
      from: mailOptions.from,
      to: mailOptions.to,
      cc: mailOptions.cc,
      subject: mailOptions.subject
    });
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log('Email sent successfully:', {
      messageId: info.messageId,
      response: info.response
    });
    
    // If using ethereal test email, provide preview URL
    if (process.env.USE_TEST_EMAIL === 'true') {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    
    return info;
  } catch (error) {
    console.error('Failed to send email:', error);
    return null;
  }
}

// Print environment variables (without sensitive values)
console.log('Environment variables:');
console.log('- MONGODB_DB:', process.env.MONGODB_DB);
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- EMAIL_HOST:', process.env.EMAIL_HOST);
console.log('- EMAIL_PORT:', process.env.EMAIL_PORT);
console.log('- EMAIL_USER:', process.env.EMAIL_USER);
console.log('- EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '[SET]' : '[NOT SET]');
console.log('- MONGODB_URI:', process.env.MONGODB_URI ? '[SET]' : '[NOT SET]');

// Manually send an email without database lookup
async function sendManualEmail() {
  try {
    console.log('Attempting to send a manual test email...');
    
    // Hard-coded values for testing
    const clientName = 'Digital Rascal Marketing';
    const clientEmail = 'help@digitalrascalmarketing.com';
    const projectDetails = {
      name: 'Digital Rascal Marketing Brand Site',
      projectId: 'opie-sicard-63'
    };
    
    console.log(`Sending manual test email to ${clientEmail}...`);
    
    // Send the email directly
    const emailResult = await sendWelcomeEmail(
      clientName,
      clientEmail,
      projectDetails
    );
    
    console.log('Email sending complete.');
    console.log('Email result:', emailResult);
    
    return emailResult;
  } catch (error) {
    console.error('Error sending manual email:', error);
    throw error;
  }
}

// Main function to resend welcome email
async function resendWelcomeEmail() {
  console.log('Starting resend welcome email process...');
  
  try {
    // Try the manual email approach first
    console.log('Trying manual email approach...');
    const manualResult = await sendManualEmail();
    console.log('Manual email sent successfully!');
    return manualResult;
  } catch (manualError) {
    console.error('Manual email approach failed:', manualError);
    console.log('Falling back to database lookup approach...');
    
    // Email address to resend to
    const targetEmail = 'help@digitalrascalmarketing.com';
    
    // Get MongoDB connection string from environment variables
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    
    console.log(`Attempting to resend welcome email to ${targetEmail} using database lookup...`);
    
    let client = null;
    
    try {
      client = new MongoClient(uri);
      console.log('MongoDB client created, attempting to connect...');
      
      await client.connect();
      console.log('Connected to MongoDB successfully');
      
      // Use the correct database name
      const dbName = process.env.MONGODB_DB || 'new-self-website-5-15-25';
      console.log(`Using database: ${dbName}`);
      
      const db = client.db(dbName);
      
      // Find the user
      console.log(`Looking up user with email: ${targetEmail}`);
      const user = await db.collection('users').findOne({ email: targetEmail });
      
      if (!user) {
        throw new Error(`User with email ${targetEmail} not found in the database`);
      }
      
      console.log(`Found user: ${user.email} with project ID: ${user.projectId}`);
      
      // Find the project
      console.log(`Looking up project with ID: ${user.projectId}`);
      const project = await db.collection('projects').findOne({ projectId: user.projectId });
      
      if (!project) {
        throw new Error(`Project with ID ${user.projectId} not found in the database`);
      }
      
      console.log(`Found project: ${project.name} (${project.projectId})`);
      
      // Get client name from project
      const clientName = project.ownerName || 'Client';
      
      // Send the welcome email
      console.log(`Sending welcome email to ${targetEmail}...`);
      const emailResult = await sendWelcomeEmail(
        clientName, 
        targetEmail, 
        { 
          name: project.name,
          projectId: project.projectId
        }
      );
      
      console.log('Email sending complete.');
      
      if (emailResult) {
        console.log('Welcome email sent successfully!');
        console.log('Email details:', emailResult);
        return emailResult;
      } else {
        throw new Error('Failed to send welcome email - no result returned');
      }
    } finally {
      if (client) {
        console.log('Closing database connection...');
        await client.close();
        console.log('Database connection closed');
      }
    }
  }
}

// Run the function and handle any errors
resendWelcomeEmail()
  .then(result => {
    console.log('Process completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Process failed with error:', error);
    process.exit(1);
  });

