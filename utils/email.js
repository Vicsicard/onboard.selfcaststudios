import nodemailer from 'nodemailer';

// Create reusable transporter using Bluehost SMTP or fallback to test account
export async function createTransporter() {
  // Check if we should use test email
  // Only use the USE_TEST_EMAIL flag, ignore NODE_ENV
  const useTestEmail = process.env.USE_TEST_EMAIL === 'true';
  
  console.log(`USE_TEST_EMAIL flag: ${process.env.USE_TEST_EMAIL}`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`Using test email: ${useTestEmail}`);
  
  // Use test email account for development
  if (useTestEmail) {
    console.log('Using test email account for development');
    try {
      const testAccount = await nodemailer.createTestAccount();
      
      console.log('Test email credentials:', {
        user: testAccount.user,
        pass: testAccount.pass,
        smtp: {
          host: testAccount.smtp.host,
          port: testAccount.smtp.port,
          secure: testAccount.smtp.secure
        }
      });
      
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
export async function sendWelcomeEmail(clientName, clientEmail, projectDetails) {
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
    
    console.log('Sending email with options:', JSON.stringify(mailOptions, null, 2));
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

// Send appointment confirmation email
export async function sendAppointmentEmail(clientName, clientEmail, appointmentDetails) {
  try {
    console.log(`Attempting to send appointment email to ${clientEmail}`);
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
      subject: "Your Workshop Interview Appointment Confirmation",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Appointment Confirmation</h2>
          <p>Hello ${clientName},</p>
          <p>Your workshop interview appointment has been scheduled.</p>
          
          <div style="background-color: #f9f9f9; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Date:</strong> ${appointmentDetails.date}</p>
            <p style="margin: 10px 0 0;"><strong>Time:</strong> ${appointmentDetails.time}</p>
            ${appointmentDetails.location ? `<p style="margin: 10px 0 0;"><strong>Location:</strong> ${appointmentDetails.location}</p>` : ''}
          </div>
          
          <p>Please make sure to prepare the following for your workshop interview:</p>
          <ul>
            <li>Any questions you have about the process</li>
            <li>Examples of websites or designs you like</li>
            <li>Content you'd like to include on your website</li>
          </ul>
          
          <p>If you need to reschedule, please contact us as soon as possible.</p>
          <p>We look forward to speaking with you!</p>
          <p>Best regards,<br>The Self Cast Studios Team</p>
        </div>
      `
    };
    
    console.log('Sending appointment email with options:', JSON.stringify(mailOptions, null, 2));
    const info = await transporter.sendMail(mailOptions);
    console.log('Appointment email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending appointment email:', error);
    throw error;
  }
}
