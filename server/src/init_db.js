require('dotenv').config();
const { pool } = require('./db');
const fs = require('fs');
const path = require('path');

async function initDB() {
    try {
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Running Schema...');
        await pool.query(schemaSql);
        console.log('Schema applied successfully.');
    } catch (err) {
        console.error('Error applying schema:', err);
    } finally {
        pool.end();
    }
}

initDB();
