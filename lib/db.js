import { MongoClient } from 'mongodb';

// Connection URI
const uri = process.env.MONGODB_URI;
let cachedClient = null;
let cachedDb = null;

if (!uri) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

export async function connectToDatabase() {
  // If we have cached values, use them
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  // If no cached connection exists, create a new one
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();

  // Cache the client and db for reuse
  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

// Utility function to create a project
export async function createProject(db, projectData) {
  try {
    const result = await db.collection('projects').insertOne({
      ...projectData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    return result.insertedId;
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
}

// Utility function to create a user
export async function createUser(db, userData) {
  try {
    const result = await db.collection('users').insertOne({
      ...userData,
      createdAt: new Date()
    });
    
    return result.insertedId;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}
