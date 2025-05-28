# Self Cast Studios - Calendly Integration

This system automatically connects Calendly bookings with onboarding form submissions by parsing email notifications.

## How It Works

1. **Client Completes Onboarding Form**: The client fills out the onboarding form on your website, which has the Calendly scheduling widget embedded in it

2. **Project Created in Database**: The form submission creates a new project in the database with the client's information

3. **Calendly Sends Booking Notifications**: When the client schedules through the embedded Calendly widget, a notification email is sent to `bookings@selfcaststudios.com`

4. **Email Parser Processes Notifications**: Our script checks this inbox regularly, extracts booking details, and links them to the matching project in the database using the client's email address

5. **Retry Mechanism**: If the booking can't be linked immediately (e.g., if the email arrives before the project is fully created), a retry script will attempt to link it later

## Setup Instructions

### 1. Email Configuration

Edit the `.env.email` file with your Bluehost email credentials:

```
EMAIL_USER=your-main-email@selfcaststudios.com
EMAIL_PASSWORD=your-email-password
EMAIL_HOST=mail.selfcaststudios.com
EMAIL_PORT=993
```

### 2. Run the Email Parser

You can run the parser manually:

```
node scripts/parse-booking-emails.js
```

Or start the scheduler to run it automatically every 15 minutes:

```
node scripts/schedule-email-parser.js
```

### 3. Deploy to Production

For production deployment on Render:

1. Add the email configuration variables to your environment settings
2. Set up a background worker to run the scheduler script
3. Make sure the MongoDB connection string is correctly configured

## Files Overview

- `scripts/parse-booking-emails.js`: Parses Calendly booking emails and links them to projects
- `scripts/retry-unlinked-bookings.js`: Retries linking any unlinked bookings with their projects
- `scripts/schedule-email-parser.js`: Runs both the parser and retry script on a regular schedule
- `pages/api/submit-onboarding.js`: Handles form submissions with optimized background processing
- `.env.email`: Configuration for email and database connections

## Troubleshooting

- **Missing Connections**: If bookings aren't being linked to projects, check that the email addresses match exactly
- **Email Access Issues**: Verify your email credentials and make sure IMAP access is enabled
- **Parsing Errors**: If the email format changes, you may need to update the parsing regex patterns

## Future Improvements

- Add a dashboard to view and manage linked bookings
- Implement email notifications when bookings are successfully linked
- Add support for cancellations and rescheduling

## Security Notes

- Keep your email credentials secure
- Consider using app-specific passwords for email access
- Regularly rotate passwords for enhanced security
