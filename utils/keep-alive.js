// Simple keep-alive utility to prevent Render from spinning down the server
const https = require('https');
const http = require('http');

// URL to ping (your Render deployment URL)
const url = 'https://onboard-selfcaststudios.onrender.com';

// Ping interval in milliseconds (5 minutes = 300000 ms)
// Render free tier spins down with inactivity, so we need to ping more frequently
const interval = 300000;

function pingServer() {
  console.log(`[${new Date().toISOString()}] Pinging server to keep alive: ${url}`);
  
  const protocol = url.startsWith('https') ? https : http;
  
  const req = protocol.get(url, (res) => {
    console.log(`[${new Date().toISOString()}] Keep-alive ping successful, status: ${res.statusCode}`);
    res.resume(); // Consume response data to free up memory
  });
  
  req.on('error', (err) => {
    console.error(`[${new Date().toISOString()}] Keep-alive ping failed:`, err.message);
  });
  
  req.end();
}

// Export the keep-alive function for use in server.js
module.exports = {
  startKeepAlive: () => {
    console.log(`[${new Date().toISOString()}] Starting keep-alive service, pinging every ${interval/1000} seconds`);
    // Initial ping
    pingServer();
    // Set up interval for subsequent pings
    return setInterval(pingServer, interval);
  }
};
