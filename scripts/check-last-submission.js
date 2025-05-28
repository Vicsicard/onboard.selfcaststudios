// Script to check the last onboarding form submission and its scheduled events
require('dotenv').config();
const { MongoClient } = require('mongodb');

// MongoDB configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://selfcaststudios:Oy0OxG1sQVkdQkYD@cluster0.gqnzwvt.mongodb.net/?retryWrites=true&w=majority';
const MONGODB_DB = process.env.MONGODB_DB || 'selfcast-onboard';

async function checkLastSubmission() {
  let client;
  
  try {
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(MONGODB_DB);
    
    console.log('Connected to MongoDB');
    
    // Get the most recent project submission
    const latestProject = await db.collection('projects')
      .find({})
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray();
    
    if (latestProject.length === 0) {
      console.log('No projects found in the database');
      return;
    }
    
    const project = latestProject[0];
    
    console.log('\n=== Latest Project Submission ===');
    console.log(`Project ID: ${project.projectId}`);
    console.log(`Name: ${project.name}`);
    console.log(`Owner: ${project.ownerName} (${project.ownerEmail})`);
    console.log(`Submitted: ${new Date(project.createdAt).toLocaleString()}`);
    
    // Check if this project has any scheduled events
    if (project.hasScheduledEvent && project.scheduledEvents && project.scheduledEvents.length > 0) {
      console.log('\n=== Associated Scheduled Events ===');
      
      // Get the scheduled events for this project
      const events = await db.collection('scheduledEvents')
        .find({ calendlyEventUri: { $in: project.scheduledEvents } })
        .toArray();
      
      if (events.length === 0) {
        console.log('No scheduled events found for this project');
      } else {
        events.forEach(event => {
          console.log(`\nEvent Type: ${event.eventTypeName}`);
          console.log(`Scheduled Date: ${new Date(event.scheduledAt).toLocaleString()}`);
          console.log(`Status: ${event.status}`);
        });
      }
    } else {
      console.log('\nNo scheduled events associated with this project');
      
      // Check if there are any events with the same email
      const ownerEmail = project.ownerEmail;
      const events = await db.collection('scheduledEvents')
        .find({ inviteeEmail: ownerEmail })
        .toArray();
      
      if (events.length > 0) {
        console.log(`\nFound ${events.length} events with email ${ownerEmail} that are not linked to the project:`);
        events.forEach(event => {
          console.log(`\nEvent Type: ${event.eventTypeName}`);
          console.log(`Scheduled Date: ${new Date(event.scheduledAt).toLocaleString()}`);
          console.log(`Status: ${event.status}`);
        });
      }
    }
    
    // Get all scheduled events
    console.log('\n=== All Recent Scheduled Events ===');
    const allEvents = await db.collection('scheduledEvents')
      .find({})
      .sort({ scheduledAt: -1 })
      .limit(5)
      .toArray();
    
    if (allEvents.length === 0) {
      console.log('No scheduled events found in the database');
    } else {
      allEvents.forEach(event => {
        console.log(`\nEvent Type: ${event.eventTypeName}`);
        console.log(`Scheduled Date: ${new Date(event.scheduledAt).toLocaleString()}`);
        console.log(`Invitee: ${event.inviteeName} (${event.inviteeEmail})`);
        console.log(`Status: ${event.status}`);
        if (event.projectId) {
          console.log(`Associated Project: ${event.projectId}`);
        }
      });
    }
    
  } catch (error) {
    console.error('Error checking last submission:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('\nDisconnected from MongoDB');
    }
  }
}

// Run the function
checkLastSubmission();
