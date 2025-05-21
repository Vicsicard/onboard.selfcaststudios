import nodemailer from 'nodemailer';

// Create reusable transporter using Bluehost SMTP
export function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'mail.selfcaststudios.com',
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER || 'welcome@selfcaststudios.com',
      pass: process.env.EMAIL_PASSWORD // Must be set in environment variables
    }
  });
}

// Send welcome/confirmation email
export async function sendWelcomeEmail(clientName, clientEmail, projectDetails) {
  const transporter = createTransporter();
  
  try {
    const info = await transporter.sendMail({
      from: '"Self Cast Studios" <welcome@selfcaststudios.com>',
      to: clientEmail,
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
          
          <a href="https://selfcaststudios.com/login" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 15px;">Access Your Dashboard</a>
          
          <p style="margin-top: 20px;">If you have any questions, please don't hesitate to contact us.</p>
          <p>Best regards,<br>The Self Cast Studios Team</p>
        </div>
      `
    });
    
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

// Send appointment confirmation email
export async function sendAppointmentEmail(clientName, clientEmail, appointmentDetails) {
  const transporter = createTransporter();
  
  try {
    const info = await transporter.sendMail({
      from: '"Self Cast Studios" <welcome@selfcaststudios.com>',
      to: clientEmail,
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
    });
    
    console.log('Appointment email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending appointment email:', error);
    throw error;
  }
}
