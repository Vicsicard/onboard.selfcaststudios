// Script to check MongoDB connection and database details
require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function checkDatabaseConnection() {
  // Get MongoDB connection string from environment variables
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.error('MONGODB_URI environment variable is not set');
    process.exit(1);
  }
  
  console.log('Checking MongoDB connection...');
  console.log(`Connection string: ${uri.replace(/:[^:]*@/, ':****@')}`); // Hide password in logs
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Successfully connected to MongoDB');
    
    // List all databases
    const adminDb = client.db('admin');
    const dbs = await adminDb.admin().listDatabases();
    
    console.log('\nAvailable databases:');
    dbs.databases.forEach(db => {
      console.log(`- ${db.name} (${db.sizeOnDisk} bytes)`);
    });
    
    // Check which database we're actually using
    const currentDb = client.db();
    console.log(`\nCurrent database: ${currentDb.databaseName}`);
    
    // Check if the expected database exists
    const expectedDbName = process.env.MONGODB_DB || 'new self website 5-15-25';
    const dbExists = dbs.databases.some(db => db.name === expectedDbName);
    
    if (dbExists) {
      console.log(`The expected database '${expectedDbName}' exists.`);
      
      // If the current database is not the expected one, switch to it
      if (currentDb.databaseName !== expectedDbName) {
        console.log(`WARNING: Currently connected to '${currentDb.databaseName}' instead of '${expectedDbName}'`);
        console.log(`This might be why your data is not being saved where you expect it.`);
        console.log(`Make sure your API is using the correct database name.`);
      }
    } else {
      console.log(`WARNING: The expected database '${expectedDbName}' does not exist!`);
      console.log(`Available databases are: ${dbs.databases.map(db => db.name).join(', ')}`);
    }
    
  } catch (error) {
    console.error('Error connecting to database:', error);
  } finally {
    await client.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the function
checkDatabaseConnection();
