// Custom server with keep-alive functionality
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { startKeepAlive } = require('./utils/keep-alive');

// Determine if we're in development or production
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Port to listen on
const port = process.env.PORT || 3000;

app.prepare().then(() => {
  // Create HTTP server
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Start listening on the specified port
  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
    
    // Start the keep-alive service in production
    if (!dev) {
      const keepAliveInterval = startKeepAlive();
      
      // Clean up the interval on server close
      server.on('close', () => {
        console.log('Server closing, clearing keep-alive interval');
        clearInterval(keepAliveInterval);
      });
    }
  });
});
