// Script to verify recent form submissions in the database
const { MongoClient } = require('mongodb');
require('dotenv').config(); // Load environment variables from .env file if present

// MongoDB connection URI - replace with your actual connection string if needed
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'new-self-website-5-15-25';

if (!uri) {
  console.error('Error: MONGODB_URI environment variable is not set.');
  console.log('Please create a .env file with your MongoDB connection string:');
  console.log('MONGODB_URI=mongodb+srv://your-connection-string');
  process.exit(1);
}

async function verifySubmission() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(dbName);
    
    // Check projects collection for recent submissions
    const recentProjects = await db.collection('projects')
      .find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();
    
    console.log(`\n=== Recent Projects (${recentProjects.length}) ===`);
    
    if (recentProjects.length === 0) {
      console.log('No projects found in the database.');
    } else {
      recentProjects.forEach((project, index) => {
        console.log(`\n[${index + 1}] Project ID: ${project.projectId}`);
        console.log(`Name: ${project.name}`);
        console.log(`Owner: ${project.ownerName} (${project.ownerEmail})`);
        console.log(`Created: ${project.createdAt}`);
        
        if (project.workshopResponses) {
          console.log('\nWorkshop Responses:');
          console.log(`- Main Story/Message: ${project.workshopResponses.successDefinition || 'N/A'}`);
          console.log(`- Goals: ${project.workshopResponses.contentGoals || 'N/A'}`);
          console.log(`- Challenges: ${project.workshopResponses.challenges || 'N/A'}`);
          console.log(`- Interests: ${project.workshopResponses.interests || 'N/A'}`);
        }
      });
      
      // Check if the most recent project was created within the last hour
      const mostRecent = recentProjects[0];
      const createdAt = new Date(mostRecent.createdAt);
      const now = new Date();
      const diffMinutes = Math.floor((now - createdAt) / (1000 * 60));
      
      console.log(`\n=== Verification Results ===`);
      if (diffMinutes < 60) {
        console.log(`✅ SUCCESS: A new project was created ${diffMinutes} minutes ago.`);
        console.log(`Project ID: ${mostRecent.projectId}`);
        console.log(`Owner: ${mostRecent.ownerName} (${mostRecent.ownerEmail})`);
      } else {
        console.log(`❌ WARNING: The most recent project was created ${diffMinutes} minutes ago.`);
        console.log(`This may not be from your recent form submission.`);
      }
    }
    
    // Check for scheduled events if we have any
    try {
      const recentEvents = await db.collection('scheduledEvents')
        .find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray();
      
      console.log(`\n\n=== Recent Scheduled Events (${recentEvents.length}) ===`);
      
      if (recentEvents.length === 0) {
        console.log('No scheduled events found in the database.');
        console.log('Note: Calendly events will only be stored once the webhook is properly configured.');
      } else {
        recentEvents.forEach((event, index) => {
          console.log(`\n[${index + 1}] Event: ${event.eventTypeName}`);
          console.log(`Invitee: ${event.inviteeName} (${event.inviteeEmail})`);
          console.log(`Scheduled for: ${new Date(event.startTime).toLocaleString()}`);
          console.log(`Status: ${event.status}`);
        });
      }
    } catch (err) {
      console.log('\nNo scheduledEvents collection found or other error:', err.message);
    }
    
  } catch (err) {
    console.error('Error connecting to database:', err);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the verification
console.log('Verifying recent form submissions...');
verifySubmission().catch(console.error);
