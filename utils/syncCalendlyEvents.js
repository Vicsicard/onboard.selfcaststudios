// Utility to sync Calendly events with our database
import { MongoClient } from 'mongodb';
import { getCurrentUser, getScheduledEvents, getEventDetails, getEventInvitees } from './calendly';

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

/**
 * Sync Calendly events with our database
 * @param {Object} options - Options for syncing events
 * @param {Date} options.startDate - Start date for fetching events (default: 30 days ago)
 * @param {Date} options.endDate - End date for fetching events (default: 30 days from now)
 * @returns {Promise<Object>} - Results of the sync operation
 */
export async function syncCalendlyEvents(options = {}) {
  const startDate = options.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
  const endDate = options.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
  
  const results = {
    total: 0,
    new: 0,
    updated: 0,
    errors: 0,
    errorDetails: []
  };
  
  try {
    // Get current user information
    const userInfo = await getCurrentUser();
    const userUri = userInfo.resource.uri;
    
    // Connect to MongoDB
    const { client, db } = await connectToDatabase();
    
    try {
      // Fetch scheduled events from Calendly
      const events = await getScheduledEvents(userUri, {
        min_start_time: startDate.toISOString(),
        max_start_time: endDate.toISOString(),
        status: 'active'
      });
      
      results.total = events.collection.length;
      
      // Process each event
      for (const event of events.collection) {
        try {
          // Check if event already exists in our database
          const existingEvent = await db.collection('scheduledEvents').findOne({
            calendlyEventUri: event.uri
          });
          
          // Get detailed event information
          const eventDetails = await getEventDetails(event.uri);
          
          // Get invitee information
          const inviteesResponse = await getEventInvitees(event.uri);
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
          
          // Find if we have a project for this invitee
          const project = await db.collection('projects').findOne({ 
            ownerEmail: invitee.email 
          });
          
          // Prepare the event data
          const eventData = {
            calendlyEventUri: event.uri,
            eventTypeUri: event.event_type,
            eventTypeName: event.name || 'Unknown Event Type',
            
            scheduledAt: new Date(event.created_at),
            startTime: new Date(event.start_time),
            endTime: new Date(event.end_time),
            timezone: event.timezone || 'UTC',
            
            inviteeUri: invitee.uri || '',
            inviteeEmail: invitee.email || '',
            inviteeName: invitee.name || '',
            inviteePhone: invitee.text_reminder_number || '',
            
            status: event.status,
            questions,
            
            updatedAt: new Date(),
            
            // Link to project if found
            projectId: project ? project.projectId : null
          };
          
          if (existingEvent) {
            // Update existing event
            await db.collection('scheduledEvents').updateOne(
              { _id: existingEvent._id },
              { $set: eventData }
            );
            results.updated++;
          } else {
            // Create new event
            eventData.createdAt = new Date();
            eventData.marketingFunnel = {
              welcomeEmailSent: false,
              reminderEmailSent: false,
              followUpEmailSent: false
            };
            
            await db.collection('scheduledEvents').insertOne(eventData);
            results.new++;
            
            // If we have a project, update it with the scheduled event information
            if (project) {
              await db.collection('projects').updateOne(
                { _id: project._id },
                { 
                  $set: { 
                    lastScheduledEvent: eventData.startTime,
                    scheduledEventUri: event.uri
                  }
                }
              );
            }
          }
        } catch (error) {
          console.error(`Error processing event ${event.uri}:`, error);
          results.errors++;
          results.errorDetails.push({
            eventUri: event.uri,
            error: error.message
          });
        }
      }
      
      return results;
    } finally {
      // Close the MongoDB connection
      await client.close();
    }
  } catch (error) {
    console.error('Error syncing Calendly events:', error);
    results.errors++;
    results.errorDetails.push({
      error: error.message
    });
    return results;
  }
}
