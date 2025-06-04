// Script to manually link the Groovy booking to the project
require('dotenv').config({ path: '.env.email' });
const { MongoClient, ObjectId } = require('mongodb');

// MongoDB configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://vicsicard:Z6T46srM9kEGZfLJ@cluster0.tfi0dul.mongodb.net/new-self-website-5-15-25?retryWrites=true&w=majority&appName=Cluster0';
const MONGODB_DB = process.env.MONGODB_DB || 'new-self-website-5-15-25';

// The specific project and email we're looking for
const TARGET_PROJECT_ID = 'groovy-96';
const TARGET_EMAIL = 'grove@gmail.com';

async function fixGroovyBooking() {
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
    
    // Find the unlinked booking with the grove@gmail.com email
    const booking = await db.collection('scheduledEvents').findOne({
      inviteeEmail: { $regex: TARGET_EMAIL, $options: 'i' },
      projectLinked: { $ne: true }
    });
    
    if (!booking) {
      console.log(`No unlinked booking found for email ${TARGET_EMAIL}`);
      return;
    }
    
    console.log('Found unlinked booking:');
    console.log(`- Booking ID: ${booking._id}`);
    console.log(`- Invitee: ${booking.inviteeName}`);
    console.log(`- Email: ${booking.inviteeEmail}`);
    
    // Update the booking to link it to the project
    const updateBookingResult = await db.collection('scheduledEvents').updateOne(
      { _id: booking._id },
      {
        $set: {
          projectId: TARGET_PROJECT_ID,
          projectLinked: true,
          updatedAt: new Date()
        }
      }
    );
    
    console.log(`Updated booking: ${updateBookingResult.modifiedCount} document(s) modified`);
    
    // Update the project to link it to the booking
    const eventId = booking._id.toString();
    const updateProjectResult = await db.collection('projects').updateOne(
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
    console.log(`Update result: ${updateProjectResult.modifiedCount} document(s) modified`);
    
    // Also update the retry script to handle the email format better
    console.log('\nNow updating the retry script to handle email formats better...');
    
  } catch (error) {
    console.error('Error fixing booking:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('Disconnected from MongoDB');
    }
  }
}

// Run the process
fixGroovyBooking()
  .then(() => console.log('Fix completed'))
  .catch(error => console.error('Fix failed:', error));
