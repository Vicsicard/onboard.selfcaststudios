# Deploying the Calendly Email Parser to Render

This guide explains how to set up the Calendly email parser as a background worker on Render.

## What We've Added

We've updated the `render.yaml` file to include a background worker configuration that will:

1. Run the email parser scheduler continuously
2. Check for new Calendly booking emails every 15 minutes
3. Attempt to link unlinked bookings every 30 minutes

## Deployment Steps

### 1. Push the Updated Configuration

The updated `render.yaml` file needs to be pushed to your GitHub repository:

```bash
git add render.yaml RENDER-DEPLOYMENT.md
git commit -m "Add Calendly email parser background worker configuration"
git push origin master
```

### 2. Configure Environment Variables on Render

Before deploying, you'll need to set up these environment variables in the Render dashboard:

- `EMAIL_PASSWORD`: The password for the bookings@selfcaststudios.com email account
- `MONGODB_URI`: Your MongoDB connection string (should already be set for the web service)

To set these up:
1. Log in to your Render dashboard
2. Go to the "Environment" tab for your worker service
3. Add the secret environment variables

### 3. Deploy the Worker

Once the configuration is pushed to GitHub:

1. Log in to your Render dashboard
2. If you have Blueprint enabled, it should automatically detect the new worker configuration
3. If not, you can manually create a new Background Worker and point it to your repository

### 4. Verify the Worker is Running

After deployment:

1. Check the logs in the Render dashboard for the worker
2. You should see messages like "Starting email parser scheduler" and "Running scheduled email parser task"
3. The worker will check for new emails every 15 minutes

## Monitoring and Maintenance

### Logs

You can view the logs for the worker in the Render dashboard to:
- Verify it's running correctly
- Check for any errors
- See when emails are processed and bookings are linked

### Updating the Worker

If you need to make changes to the email parser:

1. Update the code locally
2. Commit and push to GitHub
3. Render will automatically redeploy the worker

## Troubleshooting

If the worker isn't processing emails correctly:

1. Check the Render logs for any error messages
2. Verify the email credentials are correct
3. Make sure the IMAP settings for the email server are correct
4. Check that the MongoDB connection is working

For any issues with the MongoDB connection, make sure the `MONGODB_URI` environment variable is correctly set in the Render dashboard.

## Security Notes

- The email password is stored as a secret environment variable in Render
- The MongoDB connection string is also stored as a secret
- Make sure to rotate these credentials periodically for enhanced security
