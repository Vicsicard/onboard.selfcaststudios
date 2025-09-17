// Script to test the welcome email
require('dotenv').config({ path: '.env.local' });
const { sendWelcomeEmail } = require('./utils/email');
const fs = require('fs');

async function testWelcomeEmail() {
  try {
    console.log('Testing welcome email...');
    
    // Sample project details
    const projectDetails = {
      name: 'Test Workshop',
      projectId: 'test-workshop-123',
      projectCode: '4321'
    };
    
    // Send test email
    const result = await sendWelcomeEmail(
      'Test User', 
      'test@example.com', 
      projectDetails
    );
    
    console.log('Email sent successfully!');
    console.log('Message ID:', result.messageId);
    
    // Save the HTML to a file for viewing
    const emailHtml = `
      <html>
        <head>
          <title>Test Email Preview</title>
          <style>
            body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
          </style>
        </head>
        <body>
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome, Test User!</h2>
            
            <!-- Project Code Box - Prominently displayed at the top -->
            <div style="background-color: #ff6b6b; color: white; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px;">⚠️ IMPORTANT ⚠️</h1>
              <h2 style="margin: 10px 0; font-size: 24px;">YOUR WORKSHOP CODE</h2>
              <div style="background-color: white; color: #333; padding: 15px; border-radius: 6px; font-size: 36px; font-weight: bold; letter-spacing: 5px;">
                4321
              </div>
              <p style="margin: 15px 0 5px; font-size: 16px;"><strong>SAVE THIS CODE!</strong></p>
              <p style="margin: 5px 0; font-size: 14px;">You will need this code when you call in for your workshop interview.</p>
              <div style="background-color: white; color: #333; padding: 10px; border-radius: 6px; margin-top: 15px; font-size: 18px;">
                <p style="margin: 0;"><strong>Ready for your workshop?</strong></p>
                <p style="margin: 5px 0; font-size: 20px; color: #ff6b6b;">📞 Call <strong>850.952.9047</strong></p>
                <p style="margin: 5px 0;">Have your 4-digit code ready!</p>
              </div>
            </div>
            
            <p>Thank you for joining Self Cast Studios. Your project "Test Workshop" has been created.</p>
            
            <p>We've created an account for you with the following details:</p>
            <ul>
              <li><strong>Login Email:</strong> test@example.com</li>
              <li><strong>Project ID:</strong> test-workshop-123</li>
              <li><strong>Workshop Code:</strong> 4321 <span style="color: red; font-weight: bold;">(SAVE THIS CODE!)</span></li>
            </ul>
            
            <div style="background-color: #fffacd; border: 2px dashed #ffa500; padding: 15px; margin: 20px 0; border-radius: 6px;">
              <h3 style="margin-top: 0; color: #ff6b6b;">📝 Workshop Interview Instructions:</h3>
              
              <p><strong>Call anytime during our business hours:</strong></p>
              <div style="background-color: #fff; border: 1px solid #ff6b6b; padding: 15px; margin: 10px 0; border-radius: 6px;">
                <h4 style="margin-top: 0; color: #ff6b6b;">📅 Business Hours</h4>
                <p><strong>Monday - Friday:</strong> 9:00 AM - 5:00 PM Mountain Time</p>
                <p><strong>Phone:</strong> <span style="color: #ff6b6b; font-weight: bold;">850.952.9047</span></p>
              </div>
              
              <ol style="font-weight: bold;">
                <li>Call <span style="color: #ff6b6b;">850.952.9047</span> when you're ready for your workshop</li>
                <li>When prompted, enter your 4-digit code: <span style="color: #ff6b6b;">4321</span> using your phone keypad</li>
                <li>You'll be connected with a content producer to complete your workshop interview</li>
              </ol>
              
              <p><strong>We recommend:</strong></p>
              <ul>
                <li>Save our number (850.952.9047) and your code to your phone contacts</li>
                <li>Find a quiet place with good reception for your call</li>
                <li>Have notes ready about what you'd like to discuss in your workshop</li>
                <li>Plan for approximately 30 minutes for your workshop interview</li>
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
              <p style="margin: 5px 0; font-size: 16px;">Your workshop code: <strong style="color: #ff6b6b; font-size: 20px;">4321</strong></p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    fs.writeFileSync('./email-preview.html', emailHtml);
    console.log('Email preview saved to email-preview.html');
    
  } catch (error) {
    console.error('Error testing welcome email:', error);
  }
}

// Run the test
testWelcomeEmail();
