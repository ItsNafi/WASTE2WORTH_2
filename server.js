const http = require('http');
const path = require('path');
const app = require('./app'); // Import the Express application
const dashboardController = require('./controllers/dashboardController');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    // 1. Intercept Dashboard Route purely via native Node.js HTTP
    if (req.method === 'GET' && req.url.startsWith('/api/impact-dashboard')) {
        // Native handling bypasses Express
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        return dashboardController.getImpactMetrics(req, res);
    }
    
    // 2. Fallback to Express app for all existing routes
    return app(req, res);
});

const startServer = (port) => {
    server.listen(port, () => {
        console.log(`🚀 Native Node.js & Express server running on http://localhost:${port}`);
    }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`⚠️ Port ${port} is currently in use. Trying port ${port + 1}...`);
            startServer(port + 1);
        } else {
            console.error('Server error:', err);
        }
    });
};

startServer(Number(PORT));
