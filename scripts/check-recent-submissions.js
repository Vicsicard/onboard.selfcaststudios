// Script to check for recent submissions in the database
require('dotenv').config({ path: '.env.email' });
const { MongoClient } = require('mongodb');

// MongoDB configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://vicsicard:Z6T46srM9kEGZfLJ@cluster0.tfi0dul.mongodb.net/new-self-website-5-15-25?retryWrites=true&w=majority&appName=Cluster0';
const MONGODB_DB = process.env.MONGODB_DB || 'new-self-website-5-15-25';

async function checkRecentSubmissions() {
  let client;
  
  try {
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(MONGODB_DB);
    
    // Get recent projects (last 5)
    const recentProjects = await db.collection('projects')
      .find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();
    
    console.log(`Found ${recentProjects.length} recent projects:`);
    recentProjects.forEach(project => {
      console.log(`- Project ID: ${project.projectId}`);
      console.log(`  Name: ${project.name}`);
      console.log(`  Email: ${project.ownerEmail}`);
      console.log(`  Created: ${project.createdAt}`);
      console.log(`  Has Scheduled Event: ${project.hasScheduledEvent || false}`);
      console.log(`  Scheduled Events: ${JSON.stringify(project.scheduledEvents || [])}`);
      console.log('---');
    });
    
    // Get recent scheduled events (last 5)
    const recentEvents = await db.collection('scheduledEvents')
      .find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();
    
    console.log(`\nFound ${recentEvents.length} recent scheduled events:`);
    recentEvents.forEach(event => {
      console.log(`- Event ID: ${event._id}`);
      console.log(`  Invitee: ${event.inviteeName || 'Unknown'} (${event.inviteeEmail || 'Unknown Email'})`);
      console.log(`  Event Type: ${event.eventTypeName || 'Unknown Type'}`);
      console.log(`  Scheduled At: ${event.scheduledAt}`);
      console.log(`  Project Linked: ${event.projectLinked || false}`);
      console.log(`  Project ID: ${event.projectId || 'Not linked'}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('Error checking recent submissions:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('Disconnected from MongoDB');
    }
  }
}

// Run the check
checkRecentSubmissions()
  .then(() => console.log('Check completed'))
  .catch(error => console.error('Check failed:', error));
