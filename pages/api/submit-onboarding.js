import { MongoClient } from 'mongodb';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';

// Create reusable transporter using Bluehost SMTP
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'mail.selfcaststudios.com',
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER || 'welcome@selfcaststudios.com',
      pass: process.env.EMAIL_PASSWORD // Must be set in environment variables
    }
  });
};

// Connect to MongoDB
const connectToDatabase = async () => {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }
  
  const client = new MongoClient(uri);
  await client.connect();
  
  return {
    client,
    db: client.db()
  };
};

// Generate a project ID (slug) from the project name
const generateProjectId = (projectName) => {
  return projectName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') + 
    '-' + Math.floor(Math.random() * 100);
};

// Send confirmation email
const sendConfirmationEmail = async (clientName, clientEmail, projectDetails) => {
  const transporter = createTransporter();
  
  const info = await transporter.sendMail({
    from: '"Self Cast Studios" <welcome@selfcaststudios.com>',
    to: clientEmail,
    subject: "Welcome to Self Cast Studios!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome, ${clientName}!</h2>
        <p>Thank you for joining Self Cast Studios. Your project "${projectDetails.name}" has been created.</p>
        
        <p>You can access your project dashboard at any time using your email address: ${clientEmail}</p>
        <p>We've created an account for you with the following details:</p>
        <ul>
          <li><strong>Login Email:</strong> ${clientEmail}</li>
          <li><strong>Project ID:</strong> ${projectDetails.projectId}</li>
        </ul>
        
        <a href="https://selfcaststudios.com/login" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 15px;">Access Your Dashboard</a>
        
        <p style="margin-top: 20px;">If you have any questions, please don't hesitate to contact us.</p>
        <p>Best regards,<br>The Self Cast Studios Team</p>
      </div>
    `
  });
  
  return info;
};

export default async function handler(req, res) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get form data from request body
    const {
      clientName,
      clientEmail,
      projectName,
      phoneNumber,
      colorPreference,
      stylePackage,
      socialMedia,
      workshopResponses
    } = req.body;
    
    // Validate required fields
    if (!clientName || !clientEmail || !phoneNumber) {
      return res.status(400).json({ 
        message: 'Missing required fields: name, email, and phone number are required' 
      });
    }
    
    // Use provided project name or generate one based on client name
    const finalProjectName = projectName || `${clientName}'s Brand Site`;
    
    // Generate a project ID (slug) from the project name
    const projectId = generateProjectId(finalProjectName);
    
    // Connect to MongoDB
    const { client, db } = await connectToDatabase();
    
    try {
      // Start a session for transaction
      const session = client.startSession();
      
      let projectObjectId;
      let userObjectId;
      
      try {
        // Start transaction
        session.startTransaction();
        
        // Create the project in MongoDB
        const projectData = {
          projectId,
          name: finalProjectName,
          ownerName: clientName,
          ownerEmail: clientEmail,
          phoneNumber,
          colorPreference: colorPreference || '#4a6fa5',
          stylePackage: stylePackage || 'standard-professional',
          socialMedia: socialMedia || {
            linkedin: '',
            instagram: '',
            facebook: '',
            twitter: ''
          },
          workshopResponses: workshopResponses || {
            successDefinition: '',
            contentGoals: '',
            challenges: ''
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          content: [
            // Initial content items
            { key: 'rendered_title', value: finalProjectName },
            { key: 'footer_email', value: clientEmail },
            { key: 'about_me', value: 'Welcome to my personal brand site.' },
            { key: 'primary_color', value: colorPreference || '#4a6fa5' },
            { key: 'secondary_color', value: '#4b5563' },
            { key: 'accent_color', value: '#10b981' },
            { key: 'text_color', value: '#1f2937' },
            { key: 'heading_color', value: '#222222' },
            { key: 'title_color', value: colorPreference || '#4a6fa5' },
            { key: 'background_color', value: '#ffffff' }
          ]
        };
        
        // Add social media links to content if provided
        if (socialMedia) {
          if (socialMedia.linkedin) {
            projectData.content.push({ key: 'linkedin_profile_url', value: socialMedia.linkedin });
          }
          if (socialMedia.instagram) {
            projectData.content.push({ key: 'instagram_profile_url', value: socialMedia.instagram });
          }
          if (socialMedia.facebook) {
            projectData.content.push({ key: 'facebook_profile_url', value: socialMedia.facebook });
          }
          if (socialMedia.twitter) {
            projectData.content.push({ key: 'twitter_profile_url', value: socialMedia.twitter });
          }
        }
        
        const projectResult = await db.collection('projects').insertOne(projectData, { session });
        projectObjectId = projectResult.insertedId;
        
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
        
        const userResult = await db.collection('users').insertOne(userData, { session });
        userObjectId = userResult.insertedId;
        
        // Commit the transaction
        await session.commitTransaction();
        
      } catch (error) {
        // Abort transaction on error
        await session.abortTransaction();
        throw error;
      } finally {
        // End session
        session.endSession();
      }
      
      // Send confirmation email
      await sendConfirmationEmail(clientName, clientEmail, { name: finalProjectName, projectId });
      
      // Return success with IDs
      res.status(200).json({
        message: 'Onboarding data saved successfully',
        projectId,
        projectObjectId: projectObjectId.toString(),
        userObjectId: userObjectId.toString()
      });
      
    } finally {
      // Close the connection
      await client.close();
    }
    
  } catch (error) {
    console.error('Error processing onboarding submission:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
