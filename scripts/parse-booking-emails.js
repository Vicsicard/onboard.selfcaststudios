// Script to parse Calendly booking emails and link them to onboarding submissions
require('dotenv').config({ path: '.env.email' });
const { MongoClient } = require('mongodb');
const Imap = require('imap');
const { simpleParser } = require('mailparser');
const { inspect } = require('util');
const fs = require('fs');

// Email configuration - use the new environment variable names with fallbacks
const EMAIL_CONFIG = {
  user: process.env.BOOKING_EMAIL_USER || process.env.EMAIL_USER || 'bookings@selfcaststudios.com',
  password: process.env.BOOKING_EMAIL_PASSWORD || process.env.EMAIL_PASSWORD || 'your-email-password',
  host: process.env.BOOKING_EMAIL_HOST || process.env.EMAIL_HOST || 'mail.selfcaststudios.com',
  port: parseInt(process.env.BOOKING_EMAIL_PORT || process.env.EMAIL_PORT || '993', 10),
  tls: true,
  tlsOptions: { rejectUnauthorized: false }
};

// The email address to check for booking notifications
const BOOKING_EMAIL = process.env.BOOKING_EMAIL_ADDRESS || process.env.BOOKING_EMAIL || 'bookings@selfcaststudios.com';

// MongoDB configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://vicsicard:Z6T46srM9kEGZfLJ@cluster0.tfi0dul.mongodb.net/new-self-website-5-15-25?retryWrites=true&w=majority&appName=Cluster0';
const MONGODB_DB = process.env.MONGODB_DB || 'new-self-website-5-15-25';

// Function to connect to MongoDB
async function connectToDatabase() {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    return {
      client,
      db: client.db(MONGODB_DB)
    };
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
}

// Function to connect to email server and check for booking emails
async function checkForBookingEmails() {
  return new Promise((resolve, reject) => {
    try {
      console.log('Connecting to email server...');
      console.log(`Using email: ${EMAIL_CONFIG.user}`);
      
      // Connect to email server
      const imap = new Imap({
        user: EMAIL_CONFIG.user,
        password: EMAIL_CONFIG.password,
        host: EMAIL_CONFIG.host,
        port: EMAIL_CONFIG.port,
        tls: EMAIL_CONFIG.tls,
        tlsOptions: EMAIL_CONFIG.tlsOptions
      });

      imap.once('ready', () => {
        console.log('Connected to email server');
        fetchCalendlyEmails(imap)
          .then(emails => {
            imap.end();
            resolve(emails);
          })
          .catch(error => {
            console.error('Error fetching emails:', error);
            imap.end();
            reject(error);
          });
      });

      imap.once('error', (err) => {
        console.error('IMAP connection error:', err);
        reject(err);
      });

      imap.once('end', () => {
        console.log('IMAP connection ended');
      });

      imap.connect();
    } catch (error) {
      console.error('Error in checkForBookingEmails:', error);
      reject(error);
    }
  });
}

// Function to fetch unread emails from Calendly
function fetchCalendlyEmails(imap) {
  return new Promise((resolve, reject) => {
    try {
      imap.openBox('INBOX', false, (err, box) => {
        if (err) {
          reject(err);
          return;
        }

        // Search for unread emails from Calendly to our booking email
        // Note: We're authenticating with defense@selfcaststudios.com but looking for emails to bookings@selfcaststudios.com
        console.log(`Looking for emails from notifications@calendly.com to ${BOOKING_EMAIL}`); 
        const searchCriteria = [
          'UNSEEN', 
          ['FROM', 'notifications@calendly.com'],
          ['TO', BOOKING_EMAIL]
        ];
        
        // If we're having trouble finding emails, we can try a broader search
        // const searchCriteria = ['UNSEEN', ['FROM', 'notifications@calendly.com']];

        imap.search(searchCriteria, (err, results) => {
          if (err) {
            reject(err);
            return;
          }

          if (!results || results.length === 0) {
            console.log('No new Calendly booking emails found');
            resolve([]);
            return;
          }

          console.log(`Found ${results.length} new Calendly emails`);
          
          const emails = [];
          const fetch = imap.fetch(results, { bodies: '', markSeen: true });

          fetch.on('message', (msg, seqno) => {
            msg.on('body', (stream, info) => {
              let buffer = '';
              
              stream.on('data', (chunk) => {
                buffer += chunk.toString('utf8');
              });
              
              stream.once('end', () => {
                emails.push(buffer);
              });
            });
          });

          fetch.once('error', (err) => {
            reject(err);
          });

          fetch.once('end', () => {
            resolve(emails);
          });
        });
      });
    } catch (error) {
      reject(error);
    }
  });
}

// Function to parse email content
async function parseEmailContent(emailContent) {
  try {
    const parsed = await simpleParser(emailContent);
    
    // Check if this is a Calendly booking confirmation
    if (!parsed.subject || !parsed.subject.includes('New Event:')) {
      console.log('Not a Calendly booking email, subject:', parsed.subject);
      return null;
    }
    
    // Extract booking information from the email body
    const body = parsed.text || '';
    console.log('Parsing email body:', body.substring(0, 200) + '...');
    
    // Extract invitee name
    const inviteeMatch = body.match(/Invitee:\s*([^\n]+)/);
    const inviteeName = inviteeMatch ? inviteeMatch[1].trim() : null;
    console.log('Extracted invitee name:', inviteeName);
    
    // Extract invitee email
    const emailMatch = body.match(/Invitee Email:\s*([^\n]+)/);
    const inviteeEmail = emailMatch ? emailMatch[1].trim() : null;
    console.log('Extracted invitee email:', inviteeEmail);
    
    // Extract event type
    const eventTypeMatch = body.match(/Event Type:\s*([^\n]+)/);
    const eventType = eventTypeMatch ? eventTypeMatch[1].trim() : null;
    console.log('Extracted event type:', eventType);
    
    // Extract event date/time - format is like "12:00pm - Wednesday, May 28, 2025"
    const dateTimeMatch = body.match(/Event Date\/Time:\s*([^\n]+)/);
    let scheduledDateTime = null;
    if (dateTimeMatch) {
      const dateTimeStr = dateTimeMatch[1].trim();
      console.log('Raw date/time string:', dateTimeStr);
      
      // Parse the date string
      const dateTimeParts = dateTimeStr.split(' - ');
      if (dateTimeParts.length === 2) {
        const timeStr = dateTimeParts[0]; // e.g., "12:00pm"
        const dateStr = dateTimeParts[1]; // e.g., "Wednesday, May 28, 2025"
        
        // Remove day of week if present
        const cleanDateStr = dateStr.includes(',') ? 
          dateStr.substring(dateStr.indexOf(',') + 1).trim() : 
          dateStr.trim();
        
        const fullDateTimeStr = `${cleanDateStr} ${timeStr}`;
        console.log('Parsed date/time string:', fullDateTimeStr);
        
        scheduledDateTime = new Date(fullDateTimeStr);
        console.log('Converted to date object:', scheduledDateTime);
      }
    }
    
    // Extract location
    const locationMatch = body.match(/Location:\s*([^\n]+)/);
    const location = locationMatch ? locationMatch[1].trim() : null;
    console.log('Extracted location:', location);
    
    // Create booking object
    const booking = {
      inviteeName,
      inviteeEmail,
      eventType,
      scheduledDateTime,
      location,
      rawEmail: body,
      processedAt: new Date()
    };
    
    console.log('Created booking object:', JSON.stringify(booking, null, 2));
    return booking;
  } catch (error) {
    console.error('Error parsing email:', error);
    return null;
  }
}

// Function to link booking with project
async function linkBookingWithProject(booking, db) {
  try {
    if (!booking || !booking.inviteeEmail) {
      console.log('Invalid booking data, cannot link to project');
      return null;
    }
    
    console.log(`Searching for project with email: ${booking.inviteeEmail}`);
    
    // Find project with matching email
    const project = await db.collection('projects').findOne({
      ownerEmail: booking.inviteeEmail
    });
    
    if (!project) {
      console.log(`No project found with email: ${booking.inviteeEmail}`);
      
      // Check if there are any projects in the database
      const projectCount = await db.collection('projects').countDocuments({});
      console.log(`Total projects in database: ${projectCount}`);
      
      // Get a sample of recent projects for debugging
      if (projectCount > 0) {
        const recentProjects = await db.collection('projects')
          .find({})
          .sort({ createdAt: -1 })
          .limit(3)
          .toArray();
          
        console.log('Recent projects:');
        recentProjects.forEach(p => {
          console.log(`- ${p.projectId}: ${p.name} (${p.ownerEmail})`);
        });
      }
      
      // Store the booking anyway for future matching
      const result = await db.collection('scheduledEvents').insertOne({
        inviteeName: booking.inviteeName,
        inviteeEmail: booking.inviteeEmail,
        eventTypeName: booking.eventType,
        scheduledAt: booking.scheduledDateTime,
        location: booking.location,
        status: 'scheduled',
        source: 'email',
        createdAt: new Date(),
        updatedAt: new Date(),
        projectLinked: false,
        rawEmailData: booking.rawEmail,
        processingAttempts: 1,
        lastProcessingAttempt: new Date()
      });
      
      console.log(`Stored unlinked booking with ID: ${result.insertedId}`);
      console.log('This booking will be linked when the matching project is found');
      return null;
    }
    
    console.log(`Found matching project: ${project.projectId} for email: ${booking.inviteeEmail}`);
    
    // Create scheduled event
    const eventData = {
      inviteeName: booking.inviteeName,
      inviteeEmail: booking.inviteeEmail,
      eventTypeName: booking.eventType,
      scheduledAt: booking.scheduledDateTime,
      location: booking.location,
      status: 'scheduled',
      source: 'email',
      createdAt: new Date(),
      updatedAt: new Date(),
      projectId: project.projectId,
      projectName: project.name,
      projectLinked: true,
      rawEmailData: booking.rawEmail
    };
    
    // Save to scheduledEvents collection
    const eventResult = await db.collection('scheduledEvents').insertOne(eventData);
    console.log(`Created scheduled event with ID: ${eventResult.insertedId}`);
    
    // Update project with scheduled event info
    await db.collection('projects').updateOne(
      { _id: project._id },
      { 
        $set: { 
          hasScheduledEvent: true,
          lastScheduledEvent: booking.scheduledDateTime
        },
        $push: { 
          scheduledEvents: eventResult.insertedId.toString() 
        },
        $currentDate: { updatedAt: true }
      }
    );
    
    console.log(`Updated project ${project.projectId} with scheduled event`);
    
    return {
      projectId: project.projectId,
      eventId: eventResult.insertedId.toString()
    };
  } catch (error) {
    console.error('Error linking booking with project:', error);
    return null;
  }
}

// Main function to process emails
async function processBookingEmails() {
  let imap = null;
  let dbConnection = null;
  
  try {
    console.log('Processing booking emails...');
    
    // Connect to database
    dbConnection = await connectToDatabase();
    const { client, db } = dbConnection;
    
    // Connect to email and fetch Calendly emails
    const emails = await checkForBookingEmails();
    
    
    if (emails.length === 0) {
      console.log('No new booking emails to process');
      return;
    }
    
    console.log(`Processing ${emails.length} booking emails`);
    
    // Process each email
    for (const email of emails) {
      // Parse email content
      const booking = await parseEmailContent(email);
      
      if (!booking) {
        console.log('Could not parse booking information from email');
        continue;
      }
      
      console.log(`Parsed booking for ${booking.inviteeName} (${booking.inviteeEmail}) at ${booking.scheduledDateTime}`);
      
      // Link booking with project
      const linked = await linkBookingWithProject(booking, db);
      
      if (linked) {
        console.log(`Successfully linked booking to project ${linked.projectId}`);
      } else {
        console.log('Could not link booking to a project');
      }
    }
    
    console.log('Email processing completed');
    
  } catch (error) {
    console.error('Error processing booking emails:', error);
  } finally {
    // Close connections
    if (imap && imap.state !== 'disconnected') {
      imap.end();
      console.log('Disconnected from email server');
    }
    
    if (dbConnection && dbConnection.client) {
      await dbConnection.client.close();
      console.log('Disconnected from MongoDB');
    }
  }
}

// Run the script
processBookingEmails()
  .then(() => {
    console.log('Script execution completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script execution failed:', error);
    process.exit(1);
  });
