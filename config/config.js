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
    "username": process.env.DB_USERNAME || RDS.USERNAME,
    "password": process.env.DB_PASSWORD || RDS.PASSWORD,
    "database": process.env.DB_NAME || RDS.NAME,
    "host": process.env.DB_HOST || RDS.HOST,
    "dialect": "postgres",
    "port": 5432
  }
};

module.exports = config;