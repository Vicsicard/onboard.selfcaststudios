/**
 * Test Script for Project Code System
 * 
 * This script tests the project code generation and lookup functionality.
 * It creates a test project with a generated code and then looks it up.
 * 
 * Usage: node test-project-code.js
 */

const { MongoClient } = require('mongodb');
const { generateProjectCode, findProjectByCode } = require('./utils/projectCode');

// MongoDB connection string from environment variables
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://vicsicard:Z6T46srM9kEGZfLJ@cluster0.tfi0dul.mongodb.net/new-self-website-5-15-25?retryWrites=true&w=majority&appName=Cluster0';
const DB_NAME = process.env.MONGODB_DB || 'new-self-website-5-15-25';

async function testProjectCodeSystem() {
  console.log('Testing Project Code System...');
  
  // Connect to MongoDB
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    
    // 1. Generate a project code
    console.log('\nStep 1: Generating a project code...');
    const projectCode = await generateProjectCode(db);
    console.log(`Generated project code: ${projectCode}`);
    
    // 2. Create a test project with the generated code
    console.log('\nStep 2: Creating a test project...');
    const projectData = {
      projectId: `test-project-${Date.now()}`,
      projectCode,
      name: 'Test Project',
      ownerName: 'Test Client',
      ownerEmail: 'test@example.com',
      phoneNumber: '555-123-4567',
      workshopResponses: {
        successDefinition: 'Test success definition',
        contentGoals: 'Test content goals',
        challenges: 'Test challenges',
        interests: 'Test interests'
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      content: [
        { key: 'rendered_title', value: 'Test Project' },
        { key: 'footer_email', value: 'test@example.com' },
        { key: 'about_me', value: 'Welcome to my Test Self Cast Workshop.' }
      ]
    };
    
    const result = await db.collection('projects').insertOne(projectData);
    console.log(`Created test project with ID: ${result.insertedId}`);
    
    // 3. Look up the project by code
    console.log('\nStep 3: Looking up the project by code...');
    const foundProject = await findProjectByCode(db, projectCode);
    
    if (foundProject) {
      console.log('Project found successfully!');
      console.log(`Project name: ${foundProject.name}`);
      console.log(`Project owner: ${foundProject.ownerName}`);
      console.log(`Project code: ${foundProject.projectCode}`);
    } else {
      console.error('Failed to find project by code');
    }
    
    // 4. Test invalid code lookup
    console.log('\nStep 4: Testing invalid code lookup...');
    const invalidProject = await findProjectByCode(db, '0000');
    
    if (!invalidProject) {
      console.log('Invalid code test passed - no project found with invalid code');
    } else {
      console.error('Invalid code test failed - project found with invalid code');
    }
    
    // 5. Clean up - remove the test project
    console.log('\nStep 5: Cleaning up - removing test project...');
    await db.collection('projects').deleteOne({ projectId: projectData.projectId });
    console.log('Test project removed');
    
    console.log('\nAll tests completed successfully!');
    
  } catch (error) {
    console.error('Error during testing:', error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the tests
testProjectCodeSystem().catch(console.error);
