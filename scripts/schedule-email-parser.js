// Script to schedule the email parser and retry script to run at regular intervals
const cron = require('node-cron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Paths to scripts
const emailParserPath = path.join(__dirname, 'parse-booking-emails.js');
const retryScriptPath = path.join(__dirname, 'retry-unlinked-bookings.js');

// Log file path
const logFilePath = path.join(__dirname, 'calendly-integration-logs.txt');

// Function to append to log file
function appendToLog(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  
  fs.appendFileSync(logFilePath, logMessage);
  console.log(message);
}

// Function to run a script
function runScript(scriptPath, scriptName) {
  appendToLog(`Starting ${scriptName}...`);
  
  const process = spawn('node', [scriptPath]);
  
  process.stdout.on('data', (data) => {
    appendToLog(`${scriptName} output: ${data}`);
  });
  
  process.stderr.on('data', (data) => {
    appendToLog(`${scriptName} error: ${data}`);
  });
  
  process.on('close', (code) => {
    appendToLog(`${scriptName} process exited with code ${code}`);
  });
}

// Function to run the email parser script
function runEmailParser() {
  runScript(emailParserPath, 'Email Parser');
}

// Function to run the retry script
function runRetryScript() {
  runScript(retryScriptPath, 'Retry Script');
}

// Schedule the email parser to run every 15 minutes
// Cron format: minute hour day-of-month month day-of-week
cron.schedule('*/15 * * * *', () => {
  appendToLog('Running scheduled email parser task');
  runEmailParser();
});

// Schedule the retry script to run every 30 minutes
cron.schedule('*/30 * * * *', () => {
  appendToLog('Running scheduled retry task for unlinked bookings');
  runRetryScript();
});

// Also run both scripts once at startup
appendToLog('Starting Calendly integration scheduler');
runEmailParser();

// Run the retry script 2 minutes after startup to allow time for the email parser to complete
setTimeout(() => {
  runRetryScript();
}, 2 * 60 * 1000);

console.log('Calendly integration scheduler is running. Press Ctrl+C to exit.');

// Keep the process running
process.stdin.resume();
