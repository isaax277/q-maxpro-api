const sql = require('mssql')

const pool = new sql.ConnectionPool({
    user: 'maxpro',
    password: '5@nt0D0m1ng0',
    server: 'mssql-73940-0.cloudclusters.net',
    database: 'dbprestamos',
   	port: 16311,
    options: {
        encrypt: false, // for azure
        trustServerCertificate: true // change to true for local dev / self-signed certs
      }
});

pool.connect((err) => {
 if (err) console.log(err)
 else console.log('Conexion exitosa')
})

module.exports = pool