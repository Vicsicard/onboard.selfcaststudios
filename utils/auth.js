import bcrypt from 'bcryptjs';

// Hash a password
export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
}

// Verify a password against a hash
export async function verifyPassword(password, hashedPassword) {
  const isValid = await bcrypt.compare(password, hashedPassword);
  return isValid;
}

// Generate a random password
export function generateRandomPassword() {
  // Generate a random string of 12 characters
  return Math.random().toString(36).slice(2, 8) + 
         Math.random().toString(36).slice(2, 8);
}

// Generate a project ID (slug) from the project name
export function generateProjectId(projectName) {
  return projectName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') + 
    '-' + Math.floor(Math.random() * 100);
}
