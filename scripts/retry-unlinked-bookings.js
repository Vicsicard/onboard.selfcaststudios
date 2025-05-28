// Script to retry linking unlinked Calendly bookings with projects
require('dotenv').config({ path: '.env.email' });
const { MongoClient } = require('mongodb');

// MongoDB configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://vicsicard:Z6T46srM9kEGZfLJ@cluster0.tfi0dul.mongodb.net/new-self-website-5-15-25?retryWrites=true&w=majority&appName=Cluster0';
const MONGODB_DB = process.env.MONGODB_DB || 'new-self-website-5-15-25';

// Function to connect to MongoDB
async function connectToDatabase() {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('Connected to MongoDB');
    return {
      client,
      db: client.db(MONGODB_DB)
    };
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
}

// Function to retry linking unlinked bookings
async function retryUnlinkedBookings() {
  let dbConnection = null;
  
  try {
    // Connect to database
    dbConnection = await connectToDatabase();
    const { client, db } = dbConnection;
    
    // Find all unlinked bookings
    const unlinkedBookings = await db.collection('scheduledEvents').find({
      projectLinked: { $ne: true }
    }).toArray();
    
    console.log(`Found ${unlinkedBookings.length} unlinked bookings to process`);
    
    let linkedCount = 0;
    
    // Process each unlinked booking
    for (const booking of unlinkedBookings) {
      if (!booking.inviteeEmail) {
        console.log(`Booking ${booking._id} has no invitee email, skipping`);
        continue;
      }
      
      console.log(`Processing booking for ${booking.inviteeEmail}`);
      
      // Look for a matching project
      const project = await db.collection('projects').findOne({
        ownerEmail: booking.inviteeEmail
      });
      
      if (!project) {
        console.log(`No matching project found for ${booking.inviteeEmail}, skipping`);
        
        // Update processing attempts
        await db.collection('scheduledEvents').updateOne(
          { _id: booking._id },
          { 
            $inc: { processingAttempts: 1 },
            $set: { lastProcessingAttempt: new Date() }
          }
        );
        
        continue;
      }
      
      console.log(`Found matching project: ${project.projectId} for ${booking.inviteeEmail}`);
      
      // Update the booking with project information
      await db.collection('scheduledEvents').updateOne(
        { _id: booking._id },
        { 
          $set: { 
            projectId: project.projectId,
            projectName: project.name,
            projectLinked: true,
            updatedAt: new Date()
          },
          $inc: { processingAttempts: 1 },
          $set: { lastProcessingAttempt: new Date() }
        }
      );
      
      // Update the project with scheduled event information
      await db.collection('projects').updateOne(
        { _id: project._id },
        { 
          $set: { 
            hasScheduledEvent: true,
            lastScheduledEvent: booking.scheduledAt
          },
          $push: { 
            scheduledEvents: booking._id.toString() 
          },
          $currentDate: { updatedAt: true }
        }
      );
      
      console.log(`Successfully linked booking to project ${project.projectId}`);
      linkedCount++;
    }
    
    console.log(`Linked ${linkedCount} bookings to projects`);
    
  } catch (error) {
    console.error('Error processing unlinked bookings:', error);
  } finally {
    // Close connections
    if (dbConnection && dbConnection.client) {
      await dbConnection.client.close();
      console.log('Disconnected from MongoDB');
    }
  }
}

// Run the retry process
retryUnlinkedBookings()
  .then(() => {
    console.log('Retry process completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Retry process failed:', error);
    process.exit(1);
  });
