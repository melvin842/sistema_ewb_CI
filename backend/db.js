const { Pool } = require('pg');

const pool = process.env.DATABASE_URL
    ? new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } // necesario para PostgreSQL en la nube (Render, Railway, Supabase, etc.)
    })
    : new Pool({
        user: 'postgres',
        host: 'localhost',
        database: 'pagina web CI',
        password: '123456',
        port: 5432
    });

module.exports = pool;