const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

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
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
