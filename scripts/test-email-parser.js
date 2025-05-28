// Script to test the email parser with a sample Calendly email
require('dotenv').config({ path: '.env.email' });
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// MongoDB configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://vicsicard:Z6T46srM9kEGZfLJ@cluster0.tfi0dul.mongodb.net/new-self-website-5-15-25?retryWrites=true&w=majority&appName=Cluster0';
const MONGODB_DB = process.env.MONGODB_DB || 'new-self-website-5-15-25';

// Sample email content
const sampleEmail = `
From: Calendly <notifications@calendly.com>
To: bookings@selfcaststudios.com
Reply-To: info@digitalrascalmarketing.com
Subject: New Event: Opie sicard - 12:00pm Wed, May 28, 2025 - SelfCast Studios Storytelling Workshop

Hi Self Cast Studios,

A new event has been scheduled.

Event Type:
SelfCast Studios Storytelling Workshop

Invitee:
Opie sicard

Invitee Email:
info@digitalrascalmarketing.com

Event Date/Time:
12:00pm - Wednesday, May 28, 2025 (Mountain Time - US & Canada)

Description:

🔍 Free Self Cast Workshop – Discover Your Story, Build Your Brand

Description:

This free 1-on-1 workshop is where your visibility journey begins.

In one powerful conversation, we'll uncover the unique themes, strengths, and lived experiences that make your story worth sharing. There's no prep, no forms—just a guided, human-first conversation built around you.

What to expect:

A recorded workshop-style interview
Thoughtful questions designed to surface your voice, values, and direction
A clear next step to turn your story into an authentic online presence
Free personalized follow-up summary after the call
Whether you're building a brand, pivoting careers, or simply want clarity—this session helps you shape the foundation of your public voice.

🎯 Come as you are. We'll take it from here.

Location:
+1 850-952-9047

Invitee Time Zone:
Mountain Time - US & Canada

View event in Calendly
`;

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

// Function to parse email content
async function parseEmailContent(emailContent) {
  try {
    // Extract booking information from the email body
    const body = emailContent;
    console.log('Parsing email body...');
    
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
      
      try {
        // Extract time part (e.g., "12:00pm")
        const timeMatch = dateTimeStr.match(/(\d+:\d+(?:am|pm))/);
        const timeStr = timeMatch ? timeMatch[1] : null;
        
        // Extract date part (e.g., "May 28, 2025")
        const dateMatch = dateTimeStr.match(/(\w+)\s+(\d+),\s+(\d{4})/);
        
        if (timeStr && dateMatch) {
          const month = dateMatch[1];
          const day = dateMatch[2];
          const year = dateMatch[3];
          
          const fullDateTimeStr = `${month} ${day}, ${year} ${timeStr}`;
          console.log('Parsed date/time string:', fullDateTimeStr);
          
          scheduledDateTime = new Date(fullDateTimeStr);
          console.log('Converted to date object:', scheduledDateTime);
          
          if (isNaN(scheduledDateTime.getTime())) {
            console.log('Date parsing failed, trying alternative approach');
            
            // Alternative approach using manual date construction
            const monthMap = {
              'January': 0, 'February': 1, 'March': 2, 'April': 3, 'May': 4, 'June': 5,
              'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11
            };
            
            const monthIndex = monthMap[month];
            const dayNum = parseInt(day, 10);
            const yearNum = parseInt(year, 10);
            
            // Parse time
            let hours = parseInt(timeStr.split(':')[0], 10);
            const minutesStr = timeStr.split(':')[1];
            const minutes = parseInt(minutesStr.substring(0, 2), 10);
            const isPM = minutesStr.toLowerCase().includes('pm');
            
            if (isPM && hours < 12) hours += 12;
            if (!isPM && hours === 12) hours = 0;
            
            scheduledDateTime = new Date(yearNum, monthIndex, dayNum, hours, minutes, 0);
            console.log('Manually constructed date object:', scheduledDateTime);
          }
        } else {
          console.log('Could not extract time or date components');
        }
      } catch (error) {
        console.error('Error parsing date/time:', error);
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
    
    // Find project with matching email
    const project = await db.collection('projects').findOne({
      ownerEmail: booking.inviteeEmail
    });
    
    if (!project) {
      console.log(`No project found with email: ${booking.inviteeEmail}`);
      
      // Check for any recent projects
      const recentProjects = await db.collection('projects')
        .find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray();
      
      console.log(`Found ${recentProjects.length} recent projects:`);
      recentProjects.forEach(p => {
        console.log(`- ${p.projectId}: ${p.name} (${p.ownerEmail})`);
      });
      
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
        rawEmailData: booking.rawEmail
      });
      
      console.log(`Stored unlinked booking with ID: ${result.insertedId}`);
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

// Main function to test the email parser
async function testEmailParser() {
  let dbConnection = null;
  
  try {
    console.log('Starting email parser test...');
    
    // Parse the sample email
    const booking = await parseEmailContent(sampleEmail);
    
    if (!booking) {
      console.log('Could not parse booking information from email');
      return;
    }
    
    // Connect to database
    dbConnection = await connectToDatabase();
    const { client, db } = dbConnection;
    
    // Link booking with project
    const linked = await linkBookingWithProject(booking, db);
    
    if (linked) {
      console.log(`Successfully linked booking to project ${linked.projectId}`);
    } else {
      console.log('Could not link booking to a project');
    }
    
  } catch (error) {
    console.error('Error testing email parser:', error);
  } finally {
    // Close connections
    if (dbConnection && dbConnection.client) {
      await dbConnection.client.close();
      console.log('Disconnected from MongoDB');
    }
  }
}

// Run the test
testEmailParser()
  .then(() => {
    console.log('Test completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
