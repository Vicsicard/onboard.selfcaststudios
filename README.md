# SelfCast Onboard

## Project Overview

SelfCast Onboard is a streamlined client onboarding system for Self Cast Studios, designed to replace the current Make.com workflow with a direct, integrated solution. This system handles the post-payment onboarding process, including client information collection, appointment scheduling, and automatic account creation.

## Key Features

- **Custom Onboarding Subdomain**: Dedicated subdomain (onboard.selfcaststudios.com) for a seamless client experience
- **Integrated Form & Calendly**: Single page combining client information collection and appointment scheduling
- **Direct MongoDB Integration**: Saves client data directly to MongoDB, creating both project and user records
- **Automated Email Confirmation**: Sends welcome emails using Bluehost SMTP integration
- **User Account Creation**: Automatically creates user accounts with login credentials

## System Architecture

### Components

1. **Frontend**:
   - HTML/CSS/JavaScript form with Calendly integration
   - Form validation and submission handling
   - Success/confirmation page

2. **Backend**:
   - API endpoint for form submission processing
   - MongoDB integration for data storage
   - Nodemailer with Bluehost SMTP for email sending
   - User and project record creation

3. **Integration Points**:
   - Stripe payment success redirect
   - Calendly appointment scheduling
   - MongoDB database
   - Bluehost email service

## Data Flow

1. User completes payment on Stripe
2. User is redirected to onboard.selfcaststudios.com
3. User completes form and schedules appointment
4. Form data is submitted to API endpoint
5. API creates project and user records in MongoDB
6. Confirmation email is sent via Bluehost SMTP
7. User is shown confirmation page with next steps

## Implementation Plan

1. Set up project structure and dependencies
2. Create HTML/CSS for onboarding form
3. Implement form validation and submission
4. Create API endpoint for form processing
5. Implement MongoDB integration
6. Set up Nodemailer with Bluehost SMTP
7. Create email templates
8. Implement success/confirmation page
9. Test end-to-end flow
10. Deploy to production

## Technical Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Next.js API routes
- **Database**: MongoDB
- **Email**: Nodemailer with Bluehost SMTP
- **Scheduling**: Calendly integration
- **Hosting**: Vercel (for Next.js application)

## Benefits Over Previous Solution

- Eliminates dependency on Make.com
- Provides direct control over the entire process
- Ensures email is associated with projects from creation
- Maintains consistent branding throughout customer journey
- Reduces potential points of failure
- Saves costs on third-party automation tools
