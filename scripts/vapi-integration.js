/**
 * Vapi Integration Script for Sarah (Workshop Interview Assistant)
 * 
 * This script provides functions to integrate with the Vapi AI voice assistant (Sarah)
 * to identify clients using their 4-digit project code during workshop interviews.
 * 
 * To use this script with Vapi:
 * 1. Import the functions into your Vapi assistant configuration
 * 2. Update Sarah's conversation flow to ask for the project code
 * 3. Use the findProjectByCode function to retrieve the client's project
 */

const { MongoClient } = require('mongodb');
const { isValidProjectCode, findProjectByCode } = require('../utils/projectCode');

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
 * Vapi assistant function to identify a client by their project code
 * This can be called directly from the Vapi assistant
 * 
 * @param {string} projectCode - The 4-digit project code provided by the client
 * @returns {object} Client information or error message
 */
async function identifyClientByCode(projectCode) {
  // Validate the format of the project code
  if (!isValidProjectCode(projectCode)) {
    return {
      success: false,
      message: "That doesn't look like a valid 4-digit project code. Please check and try again."
    };
  }
  
  try {
    // Connect to the database
    const { client, db } = await connectToDatabase();
    
    try {
      // Find the project by code
      const project = await db.collection('projects').findOne({ projectCode });
      
      if (!project) {
        return {
          success: false,
          message: "I couldn't find a project with that code. Let's try with your email address instead."
        };
      }
      
      // Return the client information
      return {
        success: true,
        clientName: project.ownerName,
        clientEmail: project.ownerEmail,
        projectName: project.name,
        projectId: project.projectId,
        projectCode: project.projectCode
      };
    } finally {
      // Always close the connection
      await client.close();
    }
  } catch (error) {
    console.error('Error identifying client by code:', error);
    return {
      success: false,
      message: "I'm having trouble connecting to our system. Let's try with your email address instead."
    };
  }
}

/**
 * Vapi assistant function to identify a client by their email address
 * This is a fallback if the client doesn't have their project code
 * 
 * @param {string} email - The client's email address
 * @returns {object} Client information or error message
 */
async function identifyClientByEmail(email) {
  if (!email || !email.includes('@')) {
    return {
      success: false,
      message: "That doesn't look like a valid email address. Please try again."
    };
  }
  
  try {
    // Connect to the database
    const { client, db } = await connectToDatabase();
    
    try {
      // Find the project by email
      const project = await db.collection('projects').findOne({ ownerEmail: email.toLowerCase() });
      
      if (!project) {
        return {
          success: false,
          message: "I couldn't find a project with that email address. Please check and try again."
        };
      }
      
      // Return the client information
      return {
        success: true,
        clientName: project.ownerName,
        clientEmail: project.ownerEmail,
        projectName: project.name,
        projectId: project.projectId,
        projectCode: project.projectCode
      };
    } finally {
      // Always close the connection
      await client.close();
    }
  } catch (error) {
    console.error('Error identifying client by email:', error);
    return {
      success: false,
      message: "I'm having trouble connecting to our system. Please try again in a moment."
    };
  }
}

/**
 * Vapi assistant function to save workshop interview responses to the project
 * 
 * @param {string} projectId - The project ID
 * @param {object} responses - The workshop interview responses
 * @returns {object} Success or error message
 */
async function saveWorkshopResponses(projectId, responses) {
  if (!projectId || !responses) {
    return {
      success: false,
      message: "Missing project ID or responses"
    };
  }
  
  try {
    // Connect to the database
    const { client, db } = await connectToDatabase();
    
    try {
      // Update the project with the workshop responses
      const result = await db.collection('projects').updateOne(
        { projectId },
        { 
          $set: { 
            workshopResponses: responses,
            updatedAt: new Date()
          }
        }
      );
      
      if (result.matchedCount === 0) {
        return {
          success: false,
          message: "Project not found"
        };
      }
      
      return {
        success: true,
        message: "Workshop responses saved successfully"
      };
    } finally {
      // Always close the connection
      await client.close();
    }
  } catch (error) {
    console.error('Error saving workshop responses:', error);
    return {
      success: false,
      message: "Error saving workshop responses"
    };
  }
}

/**
 * Example Vapi conversation flow for Sarah
 * This is a template that can be adapted for the Vapi platform
 */
const sarahConversationFlow = {
  welcome: {
    say: "Hello! I'm Sarah from Self Cast Studios. I'll be conducting your workshop interview today. To get started, could you please provide your 4-digit project code? You should have received this in your welcome email.",
    listen: {
      projectCode: "identifyClientByCode",
      fallback: {
        say: "I didn't catch that. Could you please repeat your 4-digit project code?",
        listen: {
          projectCode: "identifyClientByCode",
          fallback: {
            say: "I'm still having trouble with the project code. Let's try a different approach. Could you please tell me your email address?",
            listen: {
              email: "identifyClientByEmail"
            }
          }
        }
      }
    }
  },
  
  // After successful identification
  greeting: {
    say: "Great! I've found your project, {{clientName}}. Thank you for joining us today for your workshop interview. I'll be asking you several questions about your goals and vision for your project. Your answers will help us create content that truly represents you and your brand."
  },
  
  // Workshop interview questions would continue here...
};

module.exports = {
  identifyClientByCode,
  identifyClientByEmail,
  saveWorkshopResponses,
  sarahConversationFlow
};
