import nodemailer from 'nodemailer';
import fs from 'fs';

// Helper function to log email activities to a file for debugging
const logToFile = async (message, isError = false) => {
  try {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    const logFile = './email-debug.log';
    
    // Log to console
    if (isError) {
      console.error(logMessage);
    } else {
      console.log(logMessage);
    }
    
    // Append to log file
    fs.appendFileSync(logFile, logMessage);
  } catch (err) {
    console.error(`Failed to write to log file: ${err.message}`);
  }
};

// Create reusable transporter using Bluehost SMTP or fallback to test account
export async function createTransporter() {
  // Check if we should use test email
  // Only use the USE_TEST_EMAIL flag, ignore NODE_ENV
  const useTestEmail = process.env.USE_TEST_EMAIL === 'true';
  
  await logToFile(`Creating email transporter...`);
  await logToFile(`USE_TEST_EMAIL flag: ${process.env.USE_TEST_EMAIL}`);
  await logToFile(`NODE_ENV: ${process.env.NODE_ENV}`);
  await logToFile(`Using test email: ${useTestEmail}`);
  
  // Use test email account for development
  if (useTestEmail) {
    await logToFile('Using test email account for development');
    try {
      const testAccount = await nodemailer.createTestAccount();
      
      await logToFile('Test email credentials: ' + JSON.stringify({
        user: testAccount.user,
        pass: '***REDACTED***',
        smtp: {
          host: testAccount.smtp.host,
          port: testAccount.smtp.port,
          secure: testAccount.smtp.secure
        }
      }));
      
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
      await logToFile(`Failed to create test email account: ${error.message}`, true);
      await logToFile(error.stack, true);
      
      // Fall back to console logging if test account creation fails
      return {
        sendMail: (mailOptions) => {
          logToFile('Email would have been sent with the following options: ' + JSON.stringify({
            to: mailOptions.to,
            from: mailOptions.from,
            subject: mailOptions.subject
          }));
          return Promise.resolve({ messageId: 'test-message-id' });
        }
      };
    }
  }
  
  // Use production email settings
  // Use Bluehost-specific configuration with hardcoded values to ensure consistency
  const host = 'smtp.oxcs.bluehost.com';
  const port = 587;
  const secure = false;
  const user = 'defense@selfcaststudios.com';
  const pass = process.env.EMAIL_PASSWORD || 'Jerrygarcia1993!';
  const authMethod = 'LOGIN';
  
  // Log what we're actually using
  console.log('SMTP Configuration being used:');
  console.log('Host:', host);
  console.log('Port:', port);
  console.log('Secure:', secure);
  console.log('User:', user);
  console.log('Auth Method:', authMethod);
  
  await logToFile(`Using production email configuration:`);
  await logToFile(`Host: ${host}`);
  await logToFile(`Port: ${port}`);
  await logToFile(`Secure: ${secure}`);
  await logToFile(`User: ${user}`);
  await logToFile(`Auth Method: ${authMethod}`);
  
  // Create Bluehost-specific email configuration
  const config = {
    host: host,
    port: port,
    secure: secure, // true for 465, false for other ports
    auth: {
      user: user,
      pass: pass
    },
    authMethod: authMethod,
    tls: {
      // Do not fail on invalid certs
      rejectUnauthorized: false
    },
    debug: true, // Enable debug output
    logger: true // Enable built-in logger
  };
  
  try {
    const transporter = nodemailer.createTransport(config);
    
    // Verify connection before returning
    await logToFile('Verifying SMTP connection...');
    await transporter.verify();
    await logToFile('✅ SMTP connection verified successfully');
    
    return transporter;
  } catch (error) {
    await logToFile(`❌ Failed to create email transporter: ${error.message}`, true);
    await logToFile(error.stack, true);
    
    // Re-throw the error to be handled by the caller
    throw error;
  }
}

// Send welcome/confirmation email
export async function sendWelcomeEmail(clientName, clientEmail, projectDetails) {
  try {
    await logToFile(`Attempting to send welcome email to ${clientEmail} with project code ${projectDetails.projectCode}`);
    
    // Validate inputs
    if (!clientEmail) {
      const error = new Error('Client email is required');
      await logToFile(`❌ ${error.message}`, true);
      throw error;
    }
    
    if (!projectDetails || !projectDetails.projectCode) {
      const error = new Error('Project code is required');
      await logToFile(`❌ ${error.message}`, true);
      throw error;
    }
    
    // Create transporter
    await logToFile('Creating email transporter...');
    const transporter = await createTransporter();
    await logToFile('✅ Email transporter created successfully');
    
    // Prepare email options
    const mailOptions = {
      from: '"Self Cast Studios" <defense@selfcaststudios.com>', // Must match the authenticated user
      to: clientEmail,
      cc: 'newclient@selfcaststudios.com',
      subject: `Self Cast Studios - Your Workshop Code: ${projectDetails.projectCode}`,
      priority: 'high',
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'High'
      },
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome, ${clientName}!</h2>
          
          <!-- Project Code Box - Prominently displayed at the top -->
          <div style="background-color: #ff6b6b; color: white; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">⚠️ IMPORTANT ⚠️</h1>
            <h2 style="margin: 10px 0; font-size: 24px;">YOUR WORKSHOP CODE</h2>
            <div style="background-color: white; color: #333; padding: 15px; border-radius: 6px; font-size: 36px; font-weight: bold; letter-spacing: 5px;">
              ${projectDetails.projectCode}
            </div>
            <p style="margin: 15px 0 5px; font-size: 16px;"><strong>SAVE THIS CODE!</strong></p>
            <p style="margin: 5px 0; font-size: 14px;">You will need this code when you call in for your workshop interview.</p>
            <div style="background-color: white; color: #333; padding: 10px; border-radius: 6px; margin-top: 15px; font-size: 18px;">
              <p style="margin: 0;"><strong>Ready for your workshop?</strong></p>
              <p style="margin: 5px 0; font-size: 20px; color: #ff6b6b;">📞 Call <strong>850.952.9047</strong></p>
              <p style="margin: 5px 0;">Have your 4-digit code ready!</p>
            </div>
          </div>
          
          <p>Thank you for joining Self Cast Studios. Your project "${projectDetails.name}" has been created.</p>
          
          <p>We've created an account for you with the following details:</p>
          <ul>
            <li><strong>Login Email:</strong> ${clientEmail}</li>
            <li><strong>Project ID:</strong> ${projectDetails.projectId}</li>
            <li><strong>Workshop Code:</strong> ${projectDetails.projectCode} <span style="color: red; font-weight: bold;">(SAVE THIS CODE!)</span></li>
          </ul>
          
          <div style="background-color: #fffacd; border: 2px dashed #ffa500; padding: 15px; margin: 20px 0; border-radius: 6px;">
            <h3 style="margin-top: 0; color: #ff6b6b;">📝 Workshop Interview Instructions:</h3>
            
            
            <ol style="font-weight: bold;">
              <li>Call <span style="color: #ff6b6b;">850.952.9047</span> when you're ready for your workshop</li>
              <li>When prompted, enter your 4-digit code: <span style="color: #ff6b6b;">${projectDetails.projectCode}</span> using your phone keypad</li>
              <li>You'll be connected with a content producer to complete your workshop interview</li>
            </ol>
            
            <p><strong>We recommend:</strong></p>
            <ul>
              <li>Save our number (850.952.9047) and your code to your phone contacts</li>
            </ul>
            
            <div style="background-color: #e6f7ff; border: 1px solid #1890ff; padding: 10px; margin-top: 15px; border-radius: 6px;">
              <p style="margin: 0;"><strong>💡 Pro Tip:</strong> The workshop is most productive when you come prepared with specific topics or questions you'd like to explore for your personal brand.</p>
            </div>
          </div>
          
          <p style="margin-top: 20px;">If you have any questions before your workshop, please don't hesitate to contact us at <a href="mailto:support@selfcaststudios.com" style="color: #ff6b6b;">support@selfcaststudios.com</a>.</p>
          
          <p>We look forward to helping you find your authentic voice!</p>
          
          <p>Best regards,<br>The Self Cast Studios Team</p>
          
          <!-- Final reminder of the code -->
          <div style="margin-top: 30px; padding: 15px; background-color: #f0f0f0; border-top: 1px solid #ddd; text-align: center;">
            <p style="margin: 0; font-size: 16px;">For your workshop interview:</p>
            <p style="margin: 5px 0; font-size: 18px;">📞 Call <strong>850.952.9047</strong></p>
            <p style="margin: 5px 0; font-size: 16px;">Your workshop code: <strong style="color: #ff6b6b; font-size: 20px;">${projectDetails.projectCode}</strong></p>
          </div>
        </div>
      `
    };
    
    // Send the email with detailed logging
    await logToFile(`Sending welcome email to ${clientEmail}...`);
    await logToFile(`Email subject: ${mailOptions.subject}`);
    
    try {
      const info = await transporter.sendMail(mailOptions);
      await logToFile(`✅ Welcome email sent successfully!`);
      await logToFile(`Message ID: ${info.messageId}`);
      await logToFile(`Response: ${info.response || 'No response'}`);
      return info;
    } catch (sendError) {
      await logToFile(`❌ Error sending welcome email: ${sendError.message}`, true);
      await logToFile(sendError.stack, true);
      
      // Try with a different configuration as fallback
      await logToFile(`Attempting fallback email configuration...`);
      try {
        // Create a fallback transporter with different settings
        const fallbackTransporter = nodemailer.createTransport({
          host: 'smtp.oxcs.bluehost.com',
          port: 587,
          secure: false,
          auth: {
            user: 'defense@selfcaststudios.com',
            pass: process.env.EMAIL_PASSWORD
          },
          authMethod: 'LOGIN',
          tls: { rejectUnauthorized: false }
        });
        
        const fallbackInfo = await fallbackTransporter.sendMail(mailOptions);
        await logToFile(`✅ Welcome email sent successfully using fallback configuration!`);
        await logToFile(`Fallback Message ID: ${fallbackInfo.messageId}`);
        return fallbackInfo;
      } catch (fallbackError) {
        await logToFile(`❌ Fallback email attempt also failed: ${fallbackError.message}`, true);
        throw sendError; // Throw the original error
      }
    }
  } catch (error) {
    await logToFile(`❌ Error in sendWelcomeEmail: ${error.message}`, true);
    await logToFile(error.stack, true);
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
