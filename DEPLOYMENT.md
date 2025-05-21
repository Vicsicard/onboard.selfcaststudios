# SelfCast Onboard Deployment Guide

This guide outlines the steps to deploy the SelfCast Onboard application to the `onboard.selfcaststudios.com` subdomain using Render.

## Prerequisites

- Render account (https://render.com)
- Access to your domain's DNS settings
- MongoDB Atlas account with a configured cluster
- Bluehost email credentials

## Step 1: Environment Variables

Before deploying, make sure you have the following environment variables set up:

```
MONGODB_URI=mongodb+srv://your-mongodb-connection-string
EMAIL_HOST=mail.selfcaststudios.com
EMAIL_USER=welcome@selfcaststudios.com
EMAIL_PASSWORD=your-email-password
JWT_SECRET=your-secure-jwt-secret
NEXT_PUBLIC_SITE_URL=https://onboard.selfcaststudios.com
```

## Step 2: Deploy to Render

1. Push your code to a GitHub repository
2. Log in to Render and click "New Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - Name: `selfcast-onboard`
   - Environment: `Node`
   - Region: Choose the region closest to your users
   - Branch: `main` (or your default branch)
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Instance Type: Choose based on your needs (Start with "Starter" for testing)
5. Add environment variables from Step 1
6. Click "Create Web Service"

## Step 3: Configure Custom Domain

1. In Render, go to your web service dashboard
2. Navigate to the "Settings" tab
3. Scroll down to the "Custom Domains" section
4. Click "Add Custom Domain"
5. Enter `onboard.selfcaststudios.com` and click "Save"
6. Follow Render's instructions to set up the DNS records:
   - Add a CNAME record pointing to your Render service URL (e.g., `selfcast-onboard.onrender.com`)
   - Wait for DNS propagation (can take up to 48 hours)

## Step 4: Test the Deployment

1. Visit `https://onboard.selfcaststudios.com` to ensure the site is working
2. Test the form submission to ensure data is being saved to MongoDB
3. Verify that confirmation emails are being sent correctly

## Step 5: Set Up Monitoring (Optional)

1. Enable Render's built-in logging and metrics
2. Configure error tracking with Sentry or similar service
3. Set up uptime monitoring with a service like UptimeRobot or StatusCake

## Troubleshooting

### Email Issues
- Ensure your Bluehost SMTP credentials are correct
- Check if your email provider has any sending limits
- Verify that the email template is formatted correctly

### MongoDB Connection Issues
- Ensure your MongoDB connection string is correct
- Check if your IP address is whitelisted in MongoDB Atlas
- Verify that the database and collections exist

### Deployment Issues
- Check Render build and deployment logs for any errors
- Ensure the start command is correctly set to `npm start`
- Add a `start` script to your package.json: `"start": "next start"`
- Verify that your Node.js version is compatible with Render (add `"engines": {"node": ">=16.0.0"}` to package.json)
- Check that all environment variables are correctly set in the Render dashboard

## Maintenance

- Regularly update dependencies to keep the application secure
- Monitor MongoDB performance and scale as needed
- Back up the database regularly
- Keep an eye on email deliverability

## Contact

For any deployment issues, contact the development team at [your-email@example.com].
