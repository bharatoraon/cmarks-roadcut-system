require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

app.use(cors());
app.use(express.json());

app.use('/api/roads', require('./routes/roads'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/boundaries', require('./routes/boundaries'));

// Health Check
app.get('/api/health', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({ status: 'ok', time: result.rows[0].now, env: process.env.NODE_ENV });
    } catch (err) {
        console.error('Health check failed:', err.message);
        res.status(500).json({ status: 'error', message: 'Database connection failed', error: err.message });
    }
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'C-MARKS API Server',
        version: '1.0.0',
        endpoints: ['/api/health', '/api/roads', '/api/applications', '/api/boundaries']
    });
});

// Test database connection on startup
async function testDatabaseConnection() {
    try {
        const result = await pool.query('SELECT NOW(), version()');
        console.log('✅ Database connected successfully');
        console.log('Database time:', result.rows[0].now);
    } catch (err) {
        console.error('❌ Database connection failed:', err.message);
        console.error('Connection details:', {
            host: process.env.DB_HOST,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT,
            ssl: process.env.DB_SSL
        });
    }
}

app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`Database: ${process.env.DB_HOST}/${process.env.DB_NAME}`);
    await testDatabaseConnection();
});
