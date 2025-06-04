import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import { sendWelcomeEmail } from '../../utils/email';
import { generateProjectCode } from '../../utils/projectCode';
import { exec } from 'child_process';
import path from 'path';
import { promisify } from 'util';

// Email functionality is now imported from utils/email.js

// Connect to MongoDB
const connectToDatabase = async () => {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }
  
  // Get database name from environment variables or use default
  const dbName = process.env.MONGODB_DB || 'new-self-website-5-15-25';
  
  const client = new MongoClient(uri);
  await client.connect();
  
  return {
    client,
    db: client.db(dbName)
  };
};

// Generate a project ID (slug) from the project name
const generateProjectId = (projectName) => {
  return projectName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') + 
    '-' + Math.floor(Math.random() * 100);
};

// Function to run the Calendly polling script
const runCalendlyPolling = async () => {
  try {
    console.log('[Calendly] Starting Calendly polling after form submission');
    
    // Convert exec to promise-based
    const execPromise = promisify(exec);
    
    // Get the absolute path to the polling script
    const scriptPath = path.resolve(process.cwd(), 'scripts', 'poll-calendly-events.js');
    
    // Execute the polling script
    const { stdout, stderr } = await execPromise(`node ${scriptPath}`);
    
    if (stderr) {
      console.error('[Calendly] Error running polling script:', stderr);
    } else {
      console.log('[Calendly] Polling script output:', stdout);
    }
    
    console.log('[Calendly] Completed Calendly polling');
    return true;
  } catch (error) {
    console.error('[Calendly] Failed to run polling script:', error);
    // Don't throw the error, just log it - we don't want to fail the form submission
    return false;
  }
};

// Send confirmation email with enhanced error handling and retry logic
const sendConfirmationEmail = async (clientName, clientEmail, projectDetails, calendlyBooking = null) => {
  console.log(`[Email] Attempting to send confirmation email to ${clientEmail} for project ${projectDetails.projectId}`);
  
  // Maximum number of retry attempts
  const MAX_RETRIES = 3;
  let retryCount = 0;
  let lastError = null;
  
  // Retry logic with exponential backoff
  while (retryCount < MAX_RETRIES) {
    try {
      console.log(`[Email] Attempt ${retryCount + 1} of ${MAX_RETRIES} to send email to ${clientEmail}`);
      
      // Log email details for debugging
      console.log(`[Email] Sending to: ${clientEmail}`);
      console.log(`[Email] Client name: ${clientName}`);
      console.log(`[Email] Project details:`, JSON.stringify(projectDetails));
      
      // Log Calendly booking info if available
      if (calendlyBooking) {
        console.log(`[Email] Including Calendly booking scheduled for ${new Date(calendlyBooking.startTime).toLocaleString()}`);
      }
      
      // Attempt to send the email with Calendly booking info if available
      const info = await sendWelcomeEmail(clientName, clientEmail, projectDetails, calendlyBooking);
      
      // Log success details
      console.log(`[Email] Confirmation email sent successfully to ${clientEmail}`);
      console.log(`[Email] Message ID: ${info.messageId}`);
      console.log(`[Email] Response: ${info.response}`);
      
      // Store email sending record in database if needed
      // This could be added here to track all sent emails
      
      return info;
    } catch (error) {
      lastError = error;
      retryCount++;
      
      // Log detailed error information
      console.error(`[Email] Attempt ${retryCount} failed:`, error.message);
      console.error(`[Email] Error stack:`, error.stack);
      
      if (error.code) {
        console.error(`[Email] Error code: ${error.code}`);
      }
      
      if (retryCount < MAX_RETRIES) {
        // Exponential backoff: wait longer between each retry
        const delayMs = 1000 * Math.pow(2, retryCount);
        console.log(`[Email] Retrying in ${delayMs / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  
  // All retries failed
  console.error(`[Email] All ${MAX_RETRIES} attempts to send email to ${clientEmail} failed`);
  console.error(`[Email] Last error:`, lastError);
  
  // Don't throw the error here - we want the API to continue even if email fails
  // But we return the error information for logging purposes
  return {
    success: false,
    error: lastError ? lastError.message : 'Unknown error',
    timestamp: new Date().toISOString()
  };
};

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    console.log('Received onboarding form submission');

    // Extract form data
    const { 
      projectName, 
      clientName, 
      clientEmail,
      phoneNumber,
      workshopResponses
    } = req.body;
    
    console.log('Form data extracted:', { projectName, clientName, clientEmail, phoneNumber });
    
    // Validate required fields
    if (!clientName || !clientEmail || !phoneNumber) {
      return res.status(400).json({ 
        message: 'Missing required fields: name, email, and phone number are required' 
      });
    }
    
    // Use provided project name or generate one based on client name
    const finalProjectName = projectName || `${clientName}'s Self Cast Workshop`;
    
    // Generate a project ID (slug) from the project name
    const projectId = generateProjectId(finalProjectName);
    
    // Connect to MongoDB
    const { client, db } = await connectToDatabase();
    
    try {
      // Start a session for transaction
      const session = client.startSession();
      
      let projectObjectId;
      let userObjectId;
      let projectCode; // Declare projectCode variable at this scope level
      
      try {
        // Start transaction
        session.startTransaction();
        
        // Check if there are any existing unlinked Calendly bookings for this email
        const existingBookings = await db.collection('scheduledEvents').find({
          inviteeEmail: clientEmail,
          projectLinked: { $ne: true } // Only get unlinked bookings
        }).toArray();
        
        console.log(`Found ${existingBookings.length} unlinked Calendly bookings for email: ${clientEmail}`);
        
        // Generate a unique 4-digit project code
        projectCode = await generateProjectCode(db);
        console.log(`Generated project code: ${projectCode} for project: ${projectId}`);
        
        // Create the project in MongoDB
        const projectData = {
          projectId,
          projectCode, // Add the 4-digit project code
          name: finalProjectName,
          ownerName: clientName,
          ownerEmail: clientEmail,
          phoneNumber,
          workshopResponses: workshopResponses || {
            successDefinition: '',
            contentGoals: '',
            challenges: '',
            interests: ''
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          // Add scheduled event information if available
          hasScheduledEvent: existingBookings.length > 0,
          scheduledEvents: existingBookings.map(booking => booking._id.toString()),
          content: [
            // Initial content items
            { key: 'rendered_title', value: finalProjectName },
            { key: 'footer_email', value: clientEmail },
            { key: 'about_me', value: 'Welcome to my Self Cast Workshop.' },
            { key: 'workshop_type', value: 'Free Self Cast Workshop' }
          ]
        };
        
        // Add workshop responses to content
        if (workshopResponses) {
          if (workshopResponses.interests) {
            projectData.content.push({ key: 'interests', value: workshopResponses.interests });
          }
        }
        
        const projectResult = await db.collection('projects').insertOne(projectData, { session });
        projectObjectId = projectResult.insertedId;
        
        // Generate a random password
        const randomPassword = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
        
        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(randomPassword, salt);
        
        // Create a user account for this project
        const userData = {
          email: clientEmail,
          passwordHash,
          role: 'client',
          projectId,
          createdAt: new Date()
        };
        
        const userResult = await db.collection('users').insertOne(userData, { session });
        userObjectId = userResult.insertedId;
        
        // Commit the transaction
        await session.commitTransaction();
        
      } catch (error) {
        // Abort transaction on error
        await session.abortTransaction();
        throw error;
      } finally {
        // End session
        session.endSession();
      }
      
      // Run Calendly polling FIRST to ensure we have the latest booking information
      try {
        console.log('Running Calendly polling before sending confirmation email...');
        await runCalendlyPolling();
        console.log('✅ Calendly polling completed successfully');
      } catch (pollingError) {
        console.error('Error running Calendly polling:', pollingError);
        // Continue even if polling fails
      }
      
      // Add a delay to allow time for Calendly data to be processed
      console.log('Waiting for 3 seconds to ensure Calendly data is processed...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // IMPORTANT: Send confirmation email BEFORE responding to the client
      // This ensures the email is sent before the serverless function terminates
      console.log('Sending confirmation email before responding to client...');
      try {
        // Check if there's a Calendly booking for this client
        let calendlyBooking = null;
        try {
          // Refresh the database connection to ensure we have the latest data
          const freshDb = await connectToDatabase();
          
          const bookings = await freshDb.collection('scheduledEvents').find({
            inviteeEmail: clientEmail,
            status: { $ne: 'canceled' } // Only get active bookings
          }).sort({ startTime: 1 }).limit(1).toArray();
          
          if (bookings && bookings.length > 0) {
            calendlyBooking = bookings[0];
            console.log(`Found Calendly booking for ${clientEmail} scheduled for ${new Date(calendlyBooking.startTime).toLocaleString()}`);
          } else {
            console.log(`No Calendly bookings found for ${clientEmail} after polling and delay`);
          }
        } catch (bookingError) {
          console.error('Error fetching Calendly booking:', bookingError);
          // Continue without booking info if there's an error
        }
        
        // Send confirmation email with the project code and Calendly booking if available
        await sendConfirmationEmail(clientName, clientEmail, { 
          name: finalProjectName, 
          projectId,
          projectCode // Include the project code in the email data
        }, calendlyBooking);
        console.log('✅ Confirmation email sent successfully');
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError);
        // Log error but don't fail the submission
      }
      
      // Return success after sending email
      res.status(200).json({
        message: 'Onboarding data saved successfully',
        projectId,
        projectCode, // Include the project code in the response
        projectObjectId: projectObjectId.toString(),
        userObjectId: userObjectId.toString()
      });
      
      // We've already run the Calendly polling before sending the email
    } finally {
      // Close the connection
      await client.close();
    }
    
  } catch (error) {
    console.error('Error processing onboarding submission:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
