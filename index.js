// index.js
const { conectarSQL } = require('./db');

async function main() {
    let pool;
    
    try {
        pool = await conectarSQL();
        
        if (!pool) {
            console.error('❌ No se pudo conectar a la base de datos');
            return;
        }

        const resultado = await pool.request().query('SELECT * FROM roles');
        console.log('Resultados:', resultado.recordset);
        
    } catch (err) {
        console.error('Error en la consulta:', err);
    } finally {
        // Cierra la conexión del pool, no el módulo sql
        if (pool) {
            await pool.close();
            console.log('Conexión cerrada');
        }
    }
}

main();
