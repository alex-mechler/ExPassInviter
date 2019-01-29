const {Pool} = require('pg');

const pool = new Pool({
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASS,
	database: process.env.DB_DATABASE
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err)
  process.exit(-1)
})

pool.setMaxListeners(0);

module.exports = {
	query: (text, params) => pool.query(text, params),
	pool: pool
}