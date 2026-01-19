import express from 'express';
const router = express.Router();
import { pool } from '../db.js';

// GET /api/agencies - Get all agencies
router.get('/', async (req, res) => {
    try {
        const query = 'SELECT id, name, type FROM agencies';
        const { rows } = await pool.query(query);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

export default router;