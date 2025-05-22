// Script to create a test project directly in MongoDB
require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function createTestProject() {
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
    
    // Generate a project ID (slug) from the project name
    const generateProjectId = (projectName) => {
      return projectName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') + 
        '-' + Math.floor(Math.random() * 100);
    };
    
    // Test client data
    const clientName = "Test User";
    const clientEmail = "test@example.com";
    const projectName = "Test Project";
    const projectId = generateProjectId(projectName);
    
    console.log(`Creating test project with ID: ${projectId}`);
    
    // Create the project in MongoDB
    const projectData = {
      projectId,
      name: projectName,
      ownerName: clientName,
      ownerEmail: clientEmail,
      phoneNumber: "555-123-4567",
      colorPreference: "#4a6fa5",
      stylePackage: "standard-professional",
      socialMedia: {
        linkedin: "https://linkedin.com/in/testuser",
        instagram: "https://instagram.com/testuser",
        facebook: "",
        twitter: ""
      },
      workshopResponses: {
        successDefinition: "Test success definition",
        contentGoals: "Test content goals",
        challenges: "Test challenges"
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      content: [
        { key: 'rendered_title', value: projectName },
        { key: 'footer_email', value: clientEmail },
        { key: 'about_me', value: 'Welcome to my personal brand site.' },
        { key: 'primary_color', value: "#4a6fa5" },
        { key: 'secondary_color', value: '#4b5563' },
        { key: 'accent_color', value: '#10b981' },
        { key: 'text_color', value: '#1f2937' },
        { key: 'heading_color', value: '#222222' },
        { key: 'title_color', value: "#4a6fa5" },
        { key: 'background_color', value: '#ffffff' },
        { key: 'linkedin_profile_url', value: "https://linkedin.com/in/testuser" },
        { key: 'instagram_profile_url', value: "https://instagram.com/testuser" }
      ]
    };
    
    // Insert the project
    const projectResult = await db.collection('projects').insertOne(projectData);
    console.log(`Project created with ID: ${projectResult.insertedId}`);
    
    // Generate a random password
    const randomPassword = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(randomPassword, salt);
    
    // Create a user account for this project
    const userData = {
      email: clientEmail,
      passwordHash,
      role: 'client',
      projectId,
      createdAt: new Date()
    };
    
    // Insert the user
    const userResult = await db.collection('users').insertOne(userData);
    console.log(`User created with ID: ${userResult.insertedId}`);
    
    console.log('\nTest account details:');
    console.log(`- Email: ${clientEmail}`);
    console.log(`- Project ID: ${projectId}`);
    console.log(`- Password (plaintext): ${randomPassword}`);
    
    // Verify the data was saved by retrieving it
    console.log('\nVerifying data was saved...');
    
    const savedProject = await db.collection('projects').findOne({ projectId });
    if (savedProject) {
      console.log('Project successfully saved to database!');
    } else {
      console.error('Failed to retrieve project from database!');
    }
    
    const savedUser = await db.collection('users').findOne({ email: clientEmail });
    if (savedUser) {
      console.log('User successfully saved to database!');
    } else {
      console.error('Failed to retrieve user from database!');
    }
    
  } catch (error) {
    console.error('Error creating test project:', error);
  } finally {
    await client.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the function
createTestProject();
