// Calendly API utilities
const CALENDLY_API_URL = 'https://api.calendly.com';
// Using the provided personal access token
const PERSONAL_ACCESS_TOKEN = 'eyJraWQiOiIxY2UxZTEzNjE3ZGNmNzY2YjNjZWJjY2Y4ZGM1YmFmYThhNjVlNjg0MDIzZjdjMzJiZTgzNDliMjM4MDEzNWI0IiwidHlwIjoiUEFUIiwiYWxnIjoiRVMyNTYifQ.eyJpc3MiOiJodHRwczovL2F1dGguY2FsZW5kbHkuY29tIiwiaWF0IjoxNzQ4MjAzNTk5LCJqdGkiOiI2M2QxYjQxNC0zNzA2LTQxNDEtYWRmZS02ZjBiMmE3MWFmNGUiLCJ1c2VyX3V1aWQiOiIxYzFlMWZlNi00NGM0LTQ0MGEtODM0Ny0yYjliMDhlZGE2NzEifQ.nFZokYXhu1ntA4mCkLsC98rWbK25uThEJZ2yzkPVtsUoeCz0Q0Ew1cuvgV_8bMt2o8uHKILcluFRp2BYsgKbzQ';

/**
 * Get event details from Calendly API
 * @param {string} eventUri - The URI of the event to retrieve
 * @returns {Promise<Object>} - The event details
 */
async function getEventDetails(eventUri) {
  try {
    const response = await fetch(eventUri, {
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
    console.error('Error fetching event details:', error);
    throw error;
  }
}

/**
 * Get user information from Calendly API
 * @returns {Promise<Object>} - The user information
 */
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

/**
 * Get scheduled events for a user
 * @param {string} userUri - The URI of the user
 * @param {Object} params - Query parameters for filtering events
 * @returns {Promise<Object>} - The scheduled events
 */
async function getScheduledEvents(userUri, params = {}) {
  try {
    const queryParams = new URLSearchParams({
      user: userUri,
      ...params
    });

    const response = await fetch(`${CALENDLY_API_URL}/scheduled_events?${queryParams}`, {
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
    console.error('Error fetching scheduled events:', error);
    throw error;
  }
}

/**
 * Get invitee information for an event
 * @param {string} eventUri - The URI of the event
 * @returns {Promise<Object>} - The invitee information
 */
async function getEventInvitees(eventUri) {
  try {
    const queryParams = new URLSearchParams({
      scheduled_event: eventUri
    });

    const response = await fetch(`${CALENDLY_API_URL}/scheduled_events/invitees?${queryParams}`, {
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
    console.error('Error fetching invitee information:', error);
    throw error;
  }
}

module.exports = {
  getEventDetails,
  getCurrentUser,
  getScheduledEvents,
  getEventInvitees
};
