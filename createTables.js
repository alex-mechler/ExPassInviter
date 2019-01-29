require('dotenv').config();

const db = require('./db.js');

async function createTables(){
	await db.query('CREATE TABLE account (id SERIAL PRIMARY KEY, name VARCHAR(50) NOT NULL, owner VARCHAR(50) NOT NULL, needs BOOLEAN DEFAULT false NOT NULL, has BOOLEAN DEFAULT false NOT NULL)');
	await db.query('CREATE TABLE friendship (first INT NOT NULL REFERENCES account(id), second INT NOT NULL REFERENCES account(id))');
	process.exit(0);
}

createTables();