import React from 'react';
import Head from 'next/head';

export default function EmailPreview() {
  return (
    <>
      <Head>
        <title>Email Template Preview</title>
        <style jsx global>{`
          body {
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
          }
        `}</style>
      </Head>
      
      <div className="preview-container" style={{ 
        fontFamily: 'Arial, sans-serif', 
        maxWidth: '650px', 
        margin: '40px auto',
        backgroundColor: '#ffffff',
        boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
        borderRadius: '8px',
        padding: '30px',
        lineHeight: '1.5'
      }}>
        <h2 style={{ 
          color: '#333', 
          borderBottom: '1px solid #eaeaea', 
          paddingBottom: '15px',
          marginBottom: '25px',
          fontSize: '24px'
        }}>Welcome, Test User!</h2>
        
        {/* Project Code Box - Prominently displayed at the top */}
        <div style={{ 
          backgroundColor: '#ff6b6b', 
          color: 'white', 
          padding: '25px', 
          margin: '30px 0', 
          borderRadius: '10px', 
          textAlign: 'center',
          boxShadow: '0 4px 8px rgba(255, 107, 107, 0.2)'
        }}>
          <h1 style={{ margin: 0, fontSize: '28px', textShadow: '1px 1px 2px rgba(0,0,0,0.1)' }}>⚠️ IMPORTANT ⚠️</h1>
          <h2 style={{ margin: '12px 0', fontSize: '24px', letterSpacing: '1px' }}>YOUR WORKSHOP CODE</h2>
          <div style={{ 
            backgroundColor: 'white', 
            color: '#333', 
            padding: '20px', 
            borderRadius: '8px', 
            fontSize: '42px', 
            fontWeight: 'bold', 
            letterSpacing: '8px',
            margin: '15px 0',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
          }}>
            4321
          </div>
          <p style={{ margin: '15px 0 5px', fontSize: '16px' }}><strong>SAVE THIS CODE!</strong></p>
          <p style={{ margin: '5px 0', fontSize: '14px' }}>You will need this code when you call in for your workshop interview.</p>
          
          <div style={{ 
            backgroundColor: '#ff9500', 
            color: 'white', 
            padding: '15px', 
            borderRadius: '6px', 
            margin: '15px 0 10px', 
            fontSize: '20px', 
            textAlign: 'center', 
            fontWeight: 'bold'
          }}>
            CALL ANYTIME - NO NEED TO WAIT!
          </div>
          
          <div style={{ 
            backgroundColor: 'white', 
            color: '#333', 
            padding: '15px', 
            borderRadius: '8px', 
            marginTop: '10px', 
            fontSize: '18px',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
          }}>
            <p style={{ margin: 0 }}><strong>Ready for your workshop?</strong></p>
            <p style={{ margin: '10px 0', fontSize: '22px', color: '#ff6b6b' }}>📞 Call <strong>850.952.9047</strong> NOW!</p>
            <p style={{ margin: '5px 0' }}>Have your 4-digit code ready!</p>
            <p style={{ margin: '10px 0', fontStyle: 'italic', fontWeight: 'bold', color: '#ff6b6b' }}>There's no time like the present - call now to get started!</p>
          </div>
        </div>
        
        <div style={{ margin: '30px 0', padding: '0 10px' }}>  
          <p style={{ fontSize: '16px' }}>Thank you for joining Self Cast Studios. Your project "Test Workshop" has been created.</p>
          
          <p style={{ fontSize: '16px', marginTop: '20px' }}>We've created an account for you with the following details:</p>
          <ul style={{ 
            backgroundColor: '#f9f9f9', 
            padding: '20px 20px 20px 40px',
            borderRadius: '6px',
            margin: '15px 0'
          }}>
            <li style={{ marginBottom: '8px' }}><strong>Login Email:</strong> test@example.com</li>
            <li style={{ marginBottom: '8px' }}><strong>Project ID:</strong> test-workshop-123</li>
            <li><strong>Workshop Code:</strong> 4321 <span style={{ color: '#ff3b30', fontWeight: 'bold' }}>(SAVE THIS CODE!)</span></li>
          </ul>
        </div>
        
        <div style={{ 
          backgroundColor: '#fffacd', 
          border: '2px dashed #ffa500', 
          padding: '25px', 
          margin: '30px 0', 
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(255, 165, 0, 0.1)'
        }}>
          <h3 style={{ 
            marginTop: 0, 
            color: '#ff6b6b', 
            fontSize: '20px',
            borderBottom: '1px solid rgba(255, 165, 0, 0.3)',
            paddingBottom: '10px',
            marginBottom: '20px'
          }}>📝 Workshop Interview Instructions:</h3>
          
          
          <ol style={{ 
            fontWeight: 'bold',
            padding: '0 0 0 25px',
            margin: '20px 0'
          }}>
            <li style={{ marginBottom: '15px' }}>Call <span style={{ color: '#ff6b6b', fontWeight: 'bold' }}>850.952.9047</span> when you're ready for your workshop</li>
            <li style={{ marginBottom: '15px' }}>When prompted, enter your 4-digit code: <span style={{ color: '#ff6b6b', fontWeight: 'bold' }}>4321</span> using your phone keypad</li>
            <li>You'll be connected with a content producer to complete your workshop interview</li>
          </ol>
          
          <div style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            padding: '15px 20px',
            borderRadius: '8px',
            margin: '20px 0'
          }}>
            <p style={{ marginTop: 0 }}><strong>We recommend:</strong></p>
            <ul style={{ paddingLeft: '25px' }}>
              <li>Save our number (850.952.9047) and your code to your phone contacts</li>
            </ul>
          </div>
          
          <div style={{ 
            backgroundColor: '#e6f7ff', 
            border: '1px solid #1890ff', 
            padding: '15px', 
            marginTop: '20px', 
            borderRadius: '8px',
            boxShadow: '0 2px 5px rgba(24, 144, 255, 0.1)'
          }}>
            <p style={{ margin: 0 }}><strong>💡 Pro Tip:</strong> The workshop is most productive when you come prepared with specific topics or questions you'd like to explore for your personal brand.</p>
          </div>
        </div>
        
        <div style={{ 
          margin: '30px 0 20px', 
          padding: '20px 0 0',
          borderTop: '1px solid #eaeaea'
        }}>
          <p>If you have any questions before your workshop, please don't hesitate to contact us at <a href="mailto:support@selfcaststudios.com" style={{ color: '#ff6b6b', textDecoration: 'none', fontWeight: 'bold' }}>support@selfcaststudios.com</a>.</p>
          
          <p>We look forward to helping you find your authentic voice!</p>
          
          <p style={{ marginTop: '25px' }}>Best regards,<br/><span style={{ color: '#555', fontWeight: 'bold' }}>The Self Cast Studios Team</span></p>
        </div>
        
        {/* Final reminder of the code */}
        <div style={{ 
          marginTop: '40px', 
          padding: '20px', 
          backgroundColor: '#f7f7f7', 
          borderTop: '1px solid #e0e0e0', 
          textAlign: 'center',
          borderRadius: '0 0 8px 8px'
        }}>
          <p style={{ margin: 0, fontSize: '16px', color: '#555' }}>For your workshop interview:</p>
          <p style={{ margin: '10px 0', fontSize: '20px' }}>📞 Call <strong>850.952.9047</strong></p>
          <p style={{ margin: '10px 0', fontSize: '16px' }}>Your workshop code: <strong style={{ color: '#ff6b6b', fontSize: '24px', letterSpacing: '2px' }}>4321</strong></p>
        </div>
      </div>
    </>
  );
}
