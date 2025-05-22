// Script to check for projects in MongoDB
require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function checkProjects() {
  // Get MongoDB connection string from environment variables
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.error('MONGODB_URI environment variable is not set');
    process.exit(1);
  }
  
  // Get today's date at midnight
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  console.log(`Checking for projects created today (${today.toISOString()})`);
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    // Use the correct database name
    const dbName = process.env.MONGODB_DB || 'new-self-website-5-15-25';
    console.log(`Using database: ${dbName}`);
    
    const db = client.db(dbName);
    
    // List all collections to verify we're connecting to the right database
    const collections = await db.listCollections().toArray();
    console.log("\nAvailable collections:");
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });
    
    // Check if projects collection exists
    if (!collections.some(c => c.name === 'projects')) {
      console.log("\nWARNING: 'projects' collection does not exist in this database!");
    } else {
      // Query for projects created today
      const todayProjects = await db.collection('projects')
        .find({ 
          createdAt: { $gte: today } 
        })
        .toArray();
      
      console.log(`\nFound ${todayProjects.length} projects created today:`);
      
      if (todayProjects.length > 0) {
        // Display project details
        todayProjects.forEach((project, index) => {
          console.log(`\nProject ${index + 1}:`);
          console.log(`- Project ID: ${project.projectId}`);
          console.log(`- Name: ${project.name}`);
          console.log(`- Owner: ${project.ownerName} (${project.ownerEmail})`);
          console.log(`- Created: ${project.createdAt}`);
          console.log(`- Style Package: ${project.stylePackage}`);
          console.log(`- Color Preference: ${project.colorPreference}`);
        });
      } else {
        console.log('No projects found created today.');
        
        // Get the 5 most recent projects regardless of date
        console.log('\nChecking for the 5 most recent projects:');
        const recentProjects = await db.collection('projects')
          .find({})
          .sort({ createdAt: -1 })
          .limit(5)
          .toArray();
        
        if (recentProjects.length > 0) {
          recentProjects.forEach((project, index) => {
            console.log(`\nProject ${index + 1}:`);
            console.log(`- Project ID: ${project.projectId}`);
            console.log(`- Name: ${project.name}`);
            console.log(`- Owner: ${project.ownerName} (${project.ownerEmail})`);
            console.log(`- Created: ${project.createdAt}`);
          });
        } else {
          console.log('No projects found in the database at all.');
        }
      }
    }
    
    // Check if users collection exists
    if (!collections.some(c => c.name === 'users')) {
      console.log("\nWARNING: 'users' collection does not exist in this database!");
    } else {
      // Check for users created today
      const todayUsers = await db.collection('users')
        .find({ 
          createdAt: { $gte: today } 
        })
        .toArray();
      
      console.log(`\nFound ${todayUsers.length} users created today:`);
      
      if (todayUsers.length > 0) {
        // Display user details (excluding sensitive info)
        todayUsers.forEach((user, index) => {
          console.log(`\nUser ${index + 1}:`);
          console.log(`- Email: ${user.email}`);
          console.log(`- Role: ${user.role}`);
          console.log(`- Project ID: ${user.projectId}`);
          console.log(`- Created: ${user.createdAt}`);
        });
      } else {
        console.log('No users found created today.');
        
        // Get the 5 most recent users regardless of date
        console.log('\nChecking for the 5 most recent users:');
        const recentUsers = await db.collection('users')
          .find({})
          .sort({ createdAt: -1 })
          .limit(5)
          .toArray();
        
        if (recentUsers.length > 0) {
          recentUsers.forEach((user, index) => {
            console.log(`\nUser ${index + 1}:`);
            console.log(`- Email: ${user.email}`);
            console.log(`- Role: ${user.role}`);
            console.log(`- Project ID: ${user.projectId}`);
            console.log(`- Created: ${user.createdAt}`);
          });
        } else {
          console.log('No users found in the database at all.');
        }
      }
    }
    
  } catch (error) {
    console.error('Error connecting to database:', error);
  } finally {
    await client.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the function
checkProjects();
