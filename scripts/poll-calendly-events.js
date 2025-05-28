// Script to poll Calendly for new events
require('dotenv').config();
const fetch = require('node-fetch');
const { MongoClient } = require('mongodb');
const { getEventDetails, getEventInvitees } = require('../utils/calendly');

// MongoDB configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://selfcaststudios:Oy0OxG1sQVkdQkYD@cluster0.gqnzwvt.mongodb.net/?retryWrites=true&w=majority';
const MONGODB_DB = process.env.MONGODB_DB || 'selfcast-onboard';

// Calendly API configuration
const CALENDLY_API_URL = 'https://api.calendly.com';
const PERSONAL_ACCESS_TOKEN = process.env.CALENDLY_PERSONAL_ACCESS_TOKEN || 'eyJraWQiOiIxY2UxZTEzNjE3ZGNmNzY2YjNjZWJjY2Y4ZGM1YmFmYThhNjVlNjg0MDIzZjdjMzJiZTgzNDliMjM4MDEzNWI0IiwidHlwIjoiUEFUIiwiYWxnIjoiRVMyNTYifQ.eyJpc3MiOiJodHRwczovL2F1dGguY2FsZW5kbHkuY29tIiwiaWF0IjoxNzQ4MjAzNTk5LCJqdGkiOiI2M2QxYjQxNC0zNzA2LTQxNDEtYWRmZS02ZjBiMmE3MWFmNGUiLCJ1c2VyX3V1aWQiOiIxYzFlMWZlNi00NGM0LTQ0MGEtODM0Ny0yYjliMDhlZGE2NzEifQ.nFZokYXhu1ntA4mCkLsC98rWbK25uThEJZ2yzkPVtsUoeCz0Q0Ew1cuvgV_8bMt2o8uHKILcluFRp2BYsgKbzQ';

// Connect to MongoDB
const connectToDatabase = async () => {
  try {
    const client = await MongoClient.connect(MONGODB_URI);
    return {
      client,
      db: client.db(MONGODB_DB)
    };
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
};

// Get current user information
async function getCurrentUser() {
  try {
    const response = await fetch(`${CALENDLY_API_URL}/users/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PERSONAL_ACCESS_TOKEN}`
      }
    });

    if (!response.ok) {
      throw new Error(`Calendly API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching user information:', error);
    throw error;
  }
}

// Get scheduled events from Calendly
async function getScheduledEvents(userUri, minTime = null) {
  try {
    // Build query parameters
    const params = new URLSearchParams({
      user: userUri,
      count: 100 // Get more events at once
    });
    
    // If minTime is provided, only get events after that time
    if (minTime) {
      params.append('min_start_time', minTime);
    }
    
    const response = await fetch(`${CALENDLY_API_URL}/scheduled_events?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PERSONAL_ACCESS_TOKEN}`
      }
    });

    if (!response.ok) {
      throw new Error(`Calendly API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching scheduled events:', error);
    throw error;
  }
}

// Process a scheduled event and save to database
async function processEvent(event, db) {
  try {
    // Get event details
    const eventDetails = await getEventDetails(event.uri);
    
    // Check if this event is already in the database
    const existingEvent = await db.collection('scheduledEvents').findOne({
      calendlyEventUri: event.uri
    });
    
    if (existingEvent) {
      console.log(`Event already exists in database: ${event.uri}`);
      return;
    }
    
    // With free Calendly plan, we can't access invitee details via API directly
    // But we can extract some information from the event name and questions
    
    // Try to extract email from event name or questions if available
    let extractedEmail = null;
    let extractedName = null;
    
    // Check if event has any questions that might contain email
    if (eventDetails.resource.questions_and_answers && 
        eventDetails.resource.questions_and_answers.length > 0) {
      
      // Look for email in questions
      const emailQuestion = eventDetails.resource.questions_and_answers.find(qa => 
        qa.question.toLowerCase().includes('email') || 
        (qa.answer && qa.answer.includes('@'))
      );
      
      if (emailQuestion && emailQuestion.answer) {
        extractedEmail = emailQuestion.answer.trim();
      }
      
      // Look for name in questions
      const nameQuestion = eventDetails.resource.questions_and_answers.find(qa => 
        qa.question.toLowerCase().includes('name')
      );
      
      if (nameQuestion && nameQuestion.answer) {
        extractedName = nameQuestion.answer.trim();
      }
    }
    
    // Create the event data
    const eventData = {
      calendlyEventUri: event.uri,
      eventTypeUri: event.event_type,
      eventTypeName: eventDetails.resource.name || 'Unknown Event Type',
      scheduledAt: new Date(event.start_time),
      endAt: new Date(event.end_time),
      status: 'scheduled',
      createdAt: new Date(),
      updatedAt: new Date(),
      inviteeEmail: extractedEmail || 'Not available with free plan',
      inviteeName: extractedName || 'Not available with free plan',
      // Store the raw event data for reference
      rawEventData: event
    };
    
    // Try to find a matching project based on email
    let associatedProject = null;
    if (extractedEmail) {
      associatedProject = await db.collection('projects').findOne({
        ownerEmail: extractedEmail
      });
      
      if (associatedProject) {
        console.log(`Found matching project for email ${extractedEmail}: ${associatedProject.projectId}`);
        eventData.projectId = associatedProject.projectId;
        eventData.projectName = associatedProject.name;
      }
    }
    
    // Save to database
    await db.collection('scheduledEvents').insertOne(eventData);
    console.log(`Added new event to database: ${event.uri} (${eventData.eventTypeName}) at ${eventData.scheduledAt.toLocaleString()}`);
    
    // If we found a matching project, update it with the scheduled event
    if (associatedProject) {
      await db.collection('projects').updateOne(
        { _id: associatedProject._id },
        { 
          $set: { hasScheduledEvent: true },
          $push: { scheduledEvents: eventData.calendlyEventUri },
          $currentDate: { updatedAt: true }
        }
      );
      console.log(`Updated project ${associatedProject.projectId} with scheduled event`);
    }
  } catch (error) {
    console.error(`Error processing event ${event.uri}:`, error);
  }
}

// Main function to poll for events
async function pollCalendlyEvents() {
  let connection;
  
  try {
    console.log('Starting Calendly event polling...');
    
    // Connect to database
    connection = await connectToDatabase();
    const { client, db } = connection;
    
    // Get current user information
    const userInfo = await getCurrentUser();
    console.log(`Polling events for user: ${userInfo.resource.name} (${userInfo.resource.email})`);
    
    // Get events from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const events = await getScheduledEvents(
      userInfo.resource.uri, 
      thirtyDaysAgo.toISOString()
    );
    
    console.log(`Found ${events.collection.length} events in the last 30 days`);
    
    // Process each event
    for (const event of events.collection) {
      await processEvent(event, db);
    }
    
    console.log('Event polling completed successfully');
    
    // Close database connection
    await client.close();
    console.log('Disconnected from MongoDB');
    
  } catch (error) {
    console.error('Error polling Calendly events:', error);
    
    // Close database connection if it exists
    if (connection && connection.client) {
      await connection.client.close();
      console.log('Disconnected from MongoDB');
    }
    
    process.exit(1);
  }
}

// Run the polling function
pollCalendlyEvents();
