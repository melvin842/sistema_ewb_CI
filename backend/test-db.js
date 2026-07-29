const pool = require('./db');

async function probarConexion() {
    try {
        const res = await pool.query('SELECT NOW()');
        console.log('Conexión exitosa');
        console.log(res.rows[0]);
    } catch (error) {
        console.error('Error de conexión:', error);
    }
}

probarConexion();