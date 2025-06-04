// Script to manually process Jon's booking email and link it to the project
require('dotenv').config({ path: '.env.email' });
const { MongoClient, ObjectId } = require('mongodb');

// MongoDB configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://vicsicard:Z6T46srM9kEGZfLJ@cluster0.tfi0dul.mongodb.net/new-self-website-5-15-25?retryWrites=true&w=majority&appName=Cluster0';
const MONGODB_DB = process.env.MONGODB_DB || 'new-self-website-5-15-25';

// The specific project and email we're looking for
const TARGET_PROJECT_ID = 'big-jon-90';
const TARGET_EMAIL = 'jon@gmail.com';

async function processJonBooking() {
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
    
    // Create a new booking event based on the email details
    const bookingData = {
      inviteeName: "Jon Jon",
      inviteeEmail: "jon@gmail.com",
      eventType: "SelfCast Studios Storytelling Workshop",
      scheduledDateTime: new Date("May 28, 2025 13:30:00 MDT"),
      location: "+1 850-952-9047",
      rawEmail: "Manual entry from email received at 10:25 PM",
      processedAt: new Date(),
      createdAt: new Date(),
      projectId: TARGET_PROJECT_ID,
      projectLinked: true
    };
    
    console.log('Creating booking event with data:', JSON.stringify(bookingData, null, 2));
    
    // Insert the booking into the scheduledEvents collection
    const result = await db.collection('scheduledEvents').insertOne(bookingData);
    console.log(`Created new scheduled event with ID: ${result.insertedId}`);
    
    // Update the project to link it to the booking
    const eventId = result.insertedId.toString();
    const updateResult = await db.collection('projects').updateOne(
      { projectId: TARGET_PROJECT_ID },
      { 
        $set: { 
          hasScheduledEvent: true,
          updatedAt: new Date()
        },
        $push: { 
          scheduledEvents: eventId 
        } 
      }
    );
    
    console.log(`Updated project ${TARGET_PROJECT_ID} to link to event ${eventId}`);
    console.log(`Update result: ${updateResult.modifiedCount} document(s) modified`);
    
  } catch (error) {
    console.error('Error processing booking:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('Disconnected from MongoDB');
    }
  }
}

// Run the process
processJonBooking()
  .then(() => console.log('Processing completed'))
  .catch(error => console.error('Processing failed:', error));
