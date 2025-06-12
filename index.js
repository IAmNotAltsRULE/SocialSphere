const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Log server start
console.log('Starting server...');

// Log all requests
app.use((req, res, next) => {
  console.log(`Received ${req.method} request for ${req.url}`);
  next();
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// Serve index.html for all routes
app.get('*', (req, res) => {
  console.log(`Attempting to serve index.html for route: ${req.url}`);
  const indexPath = path.join(__dirname, 'public', 'index.html');
  console.log(`Serving file from: ${indexPath}`);
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error(`Error serving index.html: ${err.message}`);
      res.status(500).json({ error: 'Failed to serve page' });
    }
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.message, err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(port, (err) => {
  if (err) {
    console.error('Failed to start server:', err.message);
  } else {
    console.log(`Server running at http://localhost:${port}`);
  }
});

// Log uncaught errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message, err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
