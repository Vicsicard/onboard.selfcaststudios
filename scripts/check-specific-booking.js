// Script to check for a specific booking in the database
require('dotenv').config({ path: '.env.email' });
const { MongoClient } = require('mongodb');

// MongoDB configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://vicsicard:Z6T46srM9kEGZfLJ@cluster0.tfi0dul.mongodb.net/new-self-website-5-15-25?retryWrites=true&w=majority&appName=Cluster0';
const MONGODB_DB = process.env.MONGODB_DB || 'new-self-website-5-15-25';

// The specific project and email we're looking for
const TARGET_PROJECT_ID = 'big-jon-90';
const TARGET_EMAIL = 'jon@gmail.com';

async function checkSpecificBooking() {
  let client;
  
  try {
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(MONGODB_DB);
    
    // Get the specific project
    const project = await db.collection('projects').findOne({ projectId: TARGET_PROJECT_ID });
    
    if (!project) {
      console.log(`Project with ID ${TARGET_PROJECT_ID} not found`);
      return;
    }
    
    console.log('Found project:');
    console.log(`- Project ID: ${project.projectId}`);
    console.log(`- Name: ${project.name}`);
    console.log(`- Email: ${project.ownerEmail}`);
    console.log(`- Created: ${project.createdAt}`);
    console.log(`- Has Scheduled Event: ${project.hasScheduledEvent || false}`);
    console.log(`- Scheduled Events: ${JSON.stringify(project.scheduledEvents || [])}`);
    
    // Look for any scheduled events with this email
    const events = await db.collection('scheduledEvents')
      .find({ inviteeEmail: TARGET_EMAIL })
      .toArray();
    
    console.log(`\nFound ${events.length} scheduled events with email ${TARGET_EMAIL}:`);
    events.forEach(event => {
      console.log(`- Event ID: ${event._id}`);
      console.log(`  Invitee: ${event.inviteeName || 'Unknown'} (${event.inviteeEmail || 'Unknown Email'})`);
      console.log(`  Event Type: ${event.eventTypeName || 'Unknown Type'}`);
      console.log(`  Scheduled At: ${event.scheduledAt}`);
      console.log(`  Project Linked: ${event.projectLinked || false}`);
      console.log(`  Project ID: ${event.projectId || 'Not linked'}`);
      console.log('---');
    });
    
    // Look for any scheduled events with "Not available with free plan"
    const freeEvents = await db.collection('scheduledEvents')
      .find({ inviteeEmail: "Not available with free plan" })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();
    
    console.log(`\nFound ${freeEvents.length} recent "Not available with free plan" events:`);
    freeEvents.forEach(event => {
      console.log(`- Event ID: ${event._id}`);
      console.log(`  Created At: ${event.createdAt}`);
      console.log(`  Event Type: ${event.eventTypeName || 'Unknown Type'}`);
      console.log(`  Scheduled At: ${event.scheduledAt}`);
      console.log('---');
    });
    
    // Check if there are any recent events that might match our timeframe
    console.log('\nChecking for any events created around the same time as the project:');
    const projectCreatedAt = new Date(project.createdAt);
    const timeWindow = 10 * 60 * 1000; // 10 minutes in milliseconds
    
    const recentEvents = await db.collection('scheduledEvents')
      .find({
        createdAt: {
          $gte: new Date(projectCreatedAt.getTime() - timeWindow),
          $lte: new Date(projectCreatedAt.getTime() + timeWindow)
        }
      })
      .toArray();
    
    console.log(`Found ${recentEvents.length} events created within 10 minutes of the project:`);
    recentEvents.forEach(event => {
      console.log(`- Event ID: ${event._id}`);
      console.log(`  Invitee: ${event.inviteeName || 'Unknown'} (${event.inviteeEmail || 'Unknown Email'})`);
      console.log(`  Created At: ${event.createdAt}`);
      console.log(`  Event Type: ${event.eventTypeName || 'Unknown Type'}`);
      console.log(`  Scheduled At: ${event.scheduledAt}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('Error checking specific booking:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('Disconnected from MongoDB');
    }
  }
}

// Run the check
checkSpecificBooking()
  .then(() => console.log('Check completed'))
  .catch(error => console.error('Check failed:', error));
