require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/roads', require('./routes/roads'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/boundaries', require('./routes/boundaries'));

// Health Check
app.get('/api/health', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({ status: 'ok', time: result.rows[0].now });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error', message: 'Database connection failed' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
