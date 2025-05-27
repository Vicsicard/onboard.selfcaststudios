import { MongoClient } from 'mongodb';
import { getEventDetails, getEventInvitees } from '../../utils/calendly';

// Connect to MongoDB
const connectToDatabase = async () => {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }
  
  // Get database name from environment variables or use default
  const dbName = process.env.MONGODB_DB || 'new-self-website-5-15-25';
  
  const client = new MongoClient(uri);
  await client.connect();
  
  return {
    client,
    db: client.db(dbName)
  };
};

export default async function handler(req, res) {
  // Only allow POST method for webhooks
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Log the incoming webhook for debugging
    console.log('Received Calendly webhook:', JSON.stringify(req.body, null, 2));
    
    const event = req.body;
    
    // Verify this is an event we want to process
    if (!event || !event.payload || !event.payload.event) {
      return res.status(400).json({ message: 'Invalid webhook payload' });
    }
    
    // Extract the event URI and event type
    const eventUri = event.payload.event.uri;
    const eventType = event.payload.event_type?.name || 'Unknown Event Type';
    
    // Connect to MongoDB
    const { client, db } = await connectToDatabase();
    
    try {
      // Get detailed event information from Calendly API
      const eventDetails = await getEventDetails(eventUri);
      
      // Get invitee information
      const inviteesResponse = await getEventInvitees(eventUri);
      const invitee = inviteesResponse.collection[0] || {};
      
      // Extract questions and answers
      const questions = [];
      if (invitee.questions_and_answers) {
        invitee.questions_and_answers.forEach(qa => {
          questions.push({
            question: qa.question,
            answer: qa.answer
          });
        });
      }
      
      // Find if we already have a project for this invitee
      const project = await db.collection('projects').findOne({ 
        ownerEmail: invitee.email 
      });
      
      // Prepare the event data for MongoDB
      const eventData = {
        calendlyEventUri: eventUri,
        eventTypeUri: event.payload.event_type?.uri || '',
        eventTypeName: eventType,
        
        scheduledAt: new Date(),
        startTime: new Date(event.payload.event.start_time),
        endTime: new Date(event.payload.event.end_time),
        timezone: event.payload.event.timezone || 'UTC',
        
        inviteeUri: invitee.uri || '',
        inviteeEmail: invitee.email || '',
        inviteeName: invitee.name || '',
        inviteePhone: invitee.text_reminder_number || '',
        
        status: 'scheduled',
        questions,
        
        marketingFunnel: {
          welcomeEmailSent: false,
          reminderEmailSent: false,
          followUpEmailSent: false
        },
        
        createdAt: new Date(),
        updatedAt: new Date(),
        
        // Link to project if found
        projectId: project ? project.projectId : null
      };
      
      // Store the event in MongoDB
      const result = await db.collection('scheduledEvents').insertOne(eventData);
      
      // If we have a project, update it with the scheduled event information
      if (project) {
        await db.collection('projects').updateOne(
          { _id: project._id },
          { 
            $set: { 
              lastScheduledEvent: eventData.startTime,
              scheduledEventUri: eventUri
            }
          }
        );
      }
      
      // Return success
      res.status(200).json({ 
        message: 'Event processed successfully',
        eventId: result.insertedId.toString()
      });
      
    } catch (error) {
      console.error('Error processing Calendly event:', error);
      res.status(500).json({ message: 'Error processing event', error: error.message });
    } finally {
      // Close the MongoDB connection
      await client.close();
    }
    
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
