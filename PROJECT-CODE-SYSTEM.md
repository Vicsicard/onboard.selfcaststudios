# Project Code System Documentation

## Overview

The Project Code System is a 4-digit identification system designed to improve client identification during workshop interviews with Sarah, our AI voice assistant. This system addresses the challenge of accurately identifying clients and their projects during voice interactions, where names and email addresses can be difficult to understand.

## Key Components

### 1. Project Code Generation

- Each new project is automatically assigned a unique 4-digit code (1000-9999) during the onboarding form submission process
- The code is stored in the MongoDB database as part of the project document
- The system ensures codes are unique across all projects

### 2. Client Communication

- The 4-digit code is prominently displayed in the welcome email sent to clients
- Multiple visual cues emphasize the importance of saving this code
- Clear instructions explain why the code is needed and how it will be used

### 3. Workshop Interview Process

- Sarah (Vapi AI assistant) asks for the 4-digit code at the beginning of the workshop interview
- The code is used to quickly and accurately identify the client's project in the database
- If the client doesn't have their code, Sarah falls back to asking for their email address

## Technical Implementation

### Database Schema Update

The project schema in MongoDB now includes a `projectCode` field:

```javascript
{
  projectId: "project-name-123",
  projectCode: "4567", // New 4-digit code field
  name: "Project Name",
  ownerName: "Client Name",
  ownerEmail: "client@example.com",
  // ... other fields
}
```

### Code Generation Function

Located in `utils/projectCode.js`, this function generates a unique 4-digit code:

```javascript
async function generateProjectCode(db) {
  while (true) {
    // Generate random 4-digit code (1000-9999)
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Check if code already exists in database
    const existingProject = await db.collection('projects').findOne({ projectCode: code });
    
    // If code is unique, return it
    if (!existingProject) {
      return code;
    }
  }
}
```

### Onboarding Form Integration

The `/api/submit-onboarding.js` endpoint has been updated to:
1. Generate a unique project code
2. Store it with the project data
3. Include it in the response
4. Pass it to the welcome email function

### Email Template Update

The welcome email template now:
1. Includes the code in the subject line
2. Displays the code prominently at the top of the email
3. Explains why the code is important
4. Provides recommendations for saving the code
5. Reminds the client about the code at the end of the email

### Vapi Integration

The `scripts/vapi-integration.js` file provides:
1. Functions to identify clients by their project code or email
2. A function to save workshop responses to the correct project
3. An example conversation flow for Sarah to ask for and validate the project code

## Implementation Checklist

- [x] Create project code utility functions
- [x] Update MongoDB schema to include project code
- [x] Modify onboarding form submission to generate and store codes
- [x] Update welcome email template to prominently display the code
- [ ] Configure Vapi assistant (Sarah) to ask for the project code
- [ ] Test the entire workflow from onboarding to workshop interview
- [ ] Monitor and gather feedback on the new system

## Benefits

1. **Improved Accuracy**: Reduces errors in identifying clients during workshop interviews
2. **Simplified Identification**: 4-digit codes are easier to communicate verbally than email addresses
3. **Better User Experience**: Creates a more professional and streamlined interview process
4. **Reduced Manual Work**: Minimizes the need for manual intervention when linking workshop responses to projects

## Future Enhancements

1. Add the project code to appointment reminder emails
2. Create a client portal where clients can look up their project code
3. Implement a system to regenerate codes if needed
4. Add analytics to track code usage and effectiveness
