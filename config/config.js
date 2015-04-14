var RDS = require( '../private.js' ).RDS;

var config = {
  "development": {
    "username": "adamback",
    "password": null,
    "database": "volta_development",
    "host": "127.0.0.1",
    "dialect": "postgres",
    "port": 5432
  },
  "production": {
    "username": 'michael',
    "password": 'B70QEioe2H',
    "database": 'voltadb',
    "host": 'voltadb.cyq2lc28ysoe.us-west-2.rds.amazonaws.com',
    "dialect": "postgres",
    "port": 5432
  }
};

module.exports = config;