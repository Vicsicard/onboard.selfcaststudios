
    import { sendWelcomeEmail } from './utils/email.js';
    
    async function runTest() {
      try {
        const result = await sendWelcomeEmail(
          'Test Client',
          'vicsicard@gmail.com',
          {
            name: 'Test Project',
            projectId: 'test-1749056763424',
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
    