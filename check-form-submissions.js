// Script to check for recent form submissions in MongoDB
require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function checkFormSubmissions() {
  // Get MongoDB connection string from environment variables
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.error('MONGODB_URI environment variable is not set');
    process.exit(1);
  }
  
  console.log('Connecting to MongoDB...');
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    // Use the correct database name
    const dbName = process.env.MONGODB_DB || 'new-self-website-5-15-25';
    console.log(`Using database: ${dbName}`);
    
    const db = client.db(dbName);
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log("\nAvailable collections:");
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });
    
    // Check if projects collection exists
    if (collections.some(c => c.name === 'projects')) {
      // Get all projects, sorted by creation date (newest first)
      const allProjects = await db.collection('projects')
        .find({})
        .sort({ createdAt: -1 })
        .toArray();
      
      console.log(`\nFound ${allProjects.length} total projects:`);
      
      if (allProjects.length > 0) {
        // Display project details
        allProjects.forEach((project, index) => {
          console.log(`\nProject ${index + 1}:`);
          console.log(`- Project ID: ${project.projectId}`);
          console.log(`- Name: ${project.name}`);
          console.log(`- Owner: ${project.ownerName} (${project.ownerEmail})`);
          console.log(`- Created: ${project.createdAt}`);
          console.log(`- Style Package: ${project.stylePackage}`);
          console.log(`- Color Preference: ${project.colorPreference}`);
        });
      } else {
        console.log('No projects found in the database.');
      }
    } else {
      console.log("\nWARNING: 'projects' collection does not exist in this database!");
    }
    
    // Check if users collection exists
    if (collections.some(c => c.name === 'users')) {
      // Get all users, sorted by creation date (newest first)
      const allUsers = await db.collection('users')
        .find({})
        .sort({ createdAt: -1 })
        .toArray();
      
      console.log(`\nFound ${allUsers.length} total users:`);
      
      if (allUsers.length > 0) {
        // Display user details (excluding sensitive info)
        allUsers.forEach((user, index) => {
          console.log(`\nUser ${index + 1}:`);
          console.log(`- Email: ${user.email}`);
          console.log(`- Role: ${user.role}`);
          console.log(`- Project ID: ${user.projectId}`);
          console.log(`- Created: ${user.createdAt}`);
        });
      } else {
        console.log('No users found in the database.');
      }
    } else {
      console.log("\nWARNING: 'users' collection does not exist in this database!");
    }
    
  } catch (error) {
    console.error('Error checking form submissions:', error);
  } finally {
    await client.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the function
checkFormSubmissions();
