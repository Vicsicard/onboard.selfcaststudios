/**
 * Project Code Utility Functions
 * 
 * This module provides functions for generating and validating unique 4-digit project codes
 * that are used to identify projects during the workshop interview process.
 */

/**
 * Generates a unique 4-digit project code
 * 
 * @param {object} db - MongoDB database connection
 * @returns {Promise<string>} A unique 4-digit code
 */
async function generateProjectCode(db) {
  // Maximum attempts to avoid infinite loops
  const MAX_ATTEMPTS = 100;
  let attempts = 0;
  
  while (attempts < MAX_ATTEMPTS) {
    // Generate random 4-digit code (1000-9999)
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    
    try {
      // Check if code already exists in database
      const existingProject = await db.collection('projects').findOne({ projectCode: code });
      
      // If code is unique, return it
      if (!existingProject) {
        return code;
      }
    } catch (error) {
      console.error('Error checking project code uniqueness:', error);
      // In case of database error, return a code with a warning log
      console.warn('Returning potentially non-unique code due to database error');
      return code;
    }
    
    attempts++;
  }
  
  // If we've exceeded max attempts, generate a timestamp-based code as fallback
  // This should be extremely rare
  const timestamp = Date.now().toString().slice(-4);
  console.warn(`Failed to generate unique code after ${MAX_ATTEMPTS} attempts. Using timestamp-based code: ${timestamp}`);
  return timestamp;
}

/**
 * Validates if a string is a valid project code format (4 digits)
 * 
 * @param {string} code - The code to validate
 * @returns {boolean} True if valid, false otherwise
 */
function isValidProjectCode(code) {
  return /^\d{4}$/.test(code);
}

/**
 * Finds a project by its project code
 * 
 * @param {object} db - MongoDB database connection
 * @param {string} code - The project code to search for
 * @returns {Promise<object|null>} The project document or null if not found
 */
async function findProjectByCode(db, code) {
  if (!isValidProjectCode(code)) {
    return null;
  }
  
  try {
    return await db.collection('projects').findOne({ projectCode: code });
  } catch (error) {
    console.error('Error finding project by code:', error);
    return null;
  }
}

module.exports = {
  generateProjectCode,
  isValidProjectCode,
  findProjectByCode
};
