const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.static('public'));

// API Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Chat Storage POC Server Running' });
});

// Serve the main HTML page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Chat Storage POC Server running on http://localhost:${PORT}`);
    console.log(`🌐 Web Interface available at http://localhost:${PORT}`);
    console.log(`📊 Browser-based IndexedDB testing ready!`);
});
