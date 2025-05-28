// Script to set up Calendly webhook subscription
require('dotenv').config();
const fetch = require('node-fetch');
const crypto = require('crypto');
const fs = require('fs');

// Calendly API configuration
const CALENDLY_API_URL = 'https://api.calendly.com';
const PERSONAL_ACCESS_TOKEN = 'eyJraWQiOiIxY2UxZTEzNjE3ZGNmNzY2YjNjZWJjY2Y4ZGM1YmFmYThhNjVlNjg0MDIzZjdjMzJiZTgzNDliMjM4MDEzNWI0IiwidHlwIjoiUEFUIiwiYWxnIjoiRVMyNTYifQ.eyJpc3MiOiJodHRwczovL2F1dGguY2FsZW5kbHkuY29tIiwiaWF0IjoxNzQ4MjAzNTk5LCJqdGkiOiI2M2QxYjQxNC0zNzA2LTQxNDEtYWRmZS02ZjBiMmE3MWFmNGUiLCJ1c2VyX3V1aWQiOiIxYzFlMWZlNi00NGM0LTQ0MGEtODM0Ny0yYjliMDhlZGE2NzEifQ.nFZokYXhu1ntA4mCkLsC98rWbK25uThEJZ2yzkPVtsUoeCz0Q0Ew1cuvgV_8bMt2o8uHKILcluFRp2BYsgKbzQ';

// Your webhook URL and signing key
const WEBHOOK_URL = 'https://onboard-selfcaststudios.onrender.com/api/calendly-webhook';
const WEBHOOK_SIGNING_KEY = crypto.randomBytes(32).toString('hex'); // Generate a random signing key

// Events to subscribe to
const EVENTS = [
  'invitee.created',
  'invitee.canceled'
];

// Function to get current user information
async function getCurrentUser() {
  try {
    const response = await fetch(`${CALENDLY_API_URL}/users/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PERSONAL_ACCESS_TOKEN}`
      }
    });

    if (!response.ok) {
      throw new Error(`Calendly API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching user information:', error);
    throw error;
  }
}

// Function to list existing webhook subscriptions
async function listWebhookSubscriptions(organizationUri, scope = 'organization') {
  try {
    // Build the query parameters
    const params = new URLSearchParams({
      organization: organizationUri,
      scope: scope
    });
    
    // If scope is 'user', we need to add the user parameter
    if (scope === 'user') {
      const userInfo = await getCurrentUser();
      params.append('user', userInfo.resource.uri);
    }
    
    console.log(`Listing webhook subscriptions with params: ${params.toString()}`);
    
    const response = await fetch(`${CALENDLY_API_URL}/webhook_subscriptions?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PERSONAL_ACCESS_TOKEN}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error (${response.status}): ${errorText}`);
      throw new Error(`Calendly API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error listing webhook subscriptions:', error);
    throw error;
  }
}

// Function to create a webhook subscription
async function createWebhookSubscription(userInfo) {
  try {
    // Get the organization URI from the user info
    const organizationUri = userInfo.resource.current_organization;
    const userUri = userInfo.resource.uri;
    
    console.log(`Creating webhook subscription for organization: ${organizationUri}`);
    console.log(`User URI: ${userUri}`);
    
    // Prepare the request body according to the API documentation
    const requestBody = {
      url: WEBHOOK_URL,
      events: EVENTS,
      organization: organizationUri,
      scope: 'organization', // Using organization scope to capture all events
      signing_key: WEBHOOK_SIGNING_KEY
    };
    
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(`${CALENDLY_API_URL}/webhook_subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PERSONAL_ACCESS_TOKEN}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error (${response.status}): ${errorText}`);
      throw new Error(`Calendly API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('Webhook created successfully:', JSON.stringify(result, null, 2));
    
    // Save the signing key to a file for future reference
    fs.writeFileSync('.webhook-signing-key', WEBHOOK_SIGNING_KEY);
    console.log(`Webhook signing key saved to .webhook-signing-key file`);
    console.log(`IMPORTANT: Add this key to your environment variables as CALENDLY_WEBHOOK_SIGNING_KEY`);
    
    return result;
  } catch (error) {
    console.error('Error creating webhook subscription:', error);
    throw error;
  }
}

// Function to delete a webhook subscription
async function deleteWebhookSubscription(webhookUri) {
  try {
    const response = await fetch(webhookUri, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PERSONAL_ACCESS_TOKEN}`
      }
    });

    if (!response.ok) {
      throw new Error(`Calendly API error: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('Error deleting webhook subscription:', error);
    throw error;
  }
}

// Main function to set up the webhook
async function setupWebhook() {
  try {
    console.log('Setting up Calendly webhook...');
    
    // Get current user information
    const userInfo = await getCurrentUser();
    console.log(`Current user: ${userInfo.resource.name} (${userInfo.resource.email})`);
    
    // Get the organization URI
    const organizationUri = userInfo.resource.current_organization;
    if (!organizationUri) {
      throw new Error('No organization found for the current user');
    }
    
    // List existing webhook subscriptions
    try {
      const webhooks = await listWebhookSubscriptions(organizationUri);
      console.log(`Found ${webhooks.collection.length} existing webhook subscriptions`);
      
      // Check if a webhook with the same URL already exists
      const existingWebhook = webhooks.collection.find(webhook => webhook.callback_url === WEBHOOK_URL);
      
      if (existingWebhook) {
        console.log(`Webhook for URL ${WEBHOOK_URL} already exists with ID: ${existingWebhook.uri}`);
        console.log(`Webhook signing key: ${WEBHOOK_SIGNING_KEY}`);
        console.log('Make sure to add this signing key to your environment variables as CALENDLY_WEBHOOK_SIGNING_KEY');
        return existingWebhook;
      }
    } catch (error) {
      console.error('Error listing webhook subscriptions:', error);
      // Continue with webhook creation even if listing fails
    }
    
    // Create a new webhook subscription
    const webhook = await createWebhookSubscription(userInfo);
    console.log(`Created new webhook subscription with ID: ${webhook.resource.uri}`);
    console.log(`Webhook signing key: ${WEBHOOK_SIGNING_KEY}`);
    console.log('Make sure to add this signing key to your environment variables as CALENDLY_WEBHOOK_SIGNING_KEY');
    
    // Save the webhook information to a file for reference
    fs.writeFileSync('webhook-info.json', JSON.stringify({
      webhook_id: webhook.resource.uri,
      webhook_url: WEBHOOK_URL,
      events: EVENTS,
      signing_key: WEBHOOK_SIGNING_KEY,
      created_at: new Date().toISOString()
    }, null, 2));
    
    return webhook;
  } catch (error) {
    console.error('Error setting up webhook:', error);
    throw error;
  }
}

// Run the setup
setupWebhook()
  .then(() => {
    console.log('\nWebhook setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Update the calendly-webhook.js file with the webhook signing key');
    console.log('2. Test the webhook by scheduling a meeting');
    console.log('3. Check the database for the scheduled event');
  })
  .catch(error => {
    console.error('\nWebhook setup failed:', error);
    process.exit(1);
  });
