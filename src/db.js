'use strict';

const { Pool, Client } = require('pg')

const database = new Client({
  user: 'cookshop',
  host: 'localhost',
  database: 'cookshop',
  password: '',
  port: 5432,
})

database.connect()

// database.query('SELECT NOW()', (err, res) => {
//   console.log(err, res)
//   database.end()
// })

module.exports = database;