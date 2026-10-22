
const sql = require('mssql/msnodesqlv8');

const servidor = process.env.DB_SERVER || 'DORIAN';
const baseDatos = process.env.DB_NAME || 'pyme_sys';


const config = {
  server: servidor,
  database: baseDatos,
  connectionString:
    `Driver={ODBC Driver 17 for SQL Server};` +
    `Server=${servidor};` +
    `Database=${baseDatos};` +
    'Trusted_Connection=Yes;' +
    'TrustServerCertificate=Yes;'
};

let poolPromise;

async function conectarSQL() {
  if (!poolPromise) {
    poolPromise = sql.connect({
      connectionString: config.connectionString
    }).catch((error) => {
      poolPromise = null;
      console.error('Error al conectar con SQL Server:', error.message);
      throw error;
    });
  }

  return poolPromise;
}

module.exports = {
  sql,
  config,
  conectarSQL
};
