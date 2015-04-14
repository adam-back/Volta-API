# Database
Volta Database Schemas using Sequelize

[Visit online](https://damp-temple-5600.herokuapp.com/).

The current routes available are:

- '/ekm': Serves a static string
- '/ekm/<stationIdNumber>': Gives a single-day, JSON report of any station

### Stack

- Express
- Sequelize
- PostgreSQL

## Run Locally

### System Requirements

- [Node.js](https://nodejs.org/download/)
- [PostgreSQL 9.3](http://www.postgresql.org/docs/9.3/interactive/installation.html)
- [Nodemon](http://nodemon.io/)

### Configure
Run `npm install`.

Create a file called `private.js`. This should include:
```javascript
module.exports = {
  APIkey: // your key
};
 ```

Create a local PostgreSQL database using with the name `volta_development`. Fill the 'development' object in `config/config.js` with your own information:
```javascript
// change these
'username': 'someRootUsername',
'password': 'yourLocalDBPW',
// these stay the same
'database': 'volta_development',
'host': '127.0.0.1',
'dialect': 'postgres',
'port': 5432
```

### Starting the server
1. Start PostgreSQL.
1. Run `npm start` from the terminal.
1. Open a browser to [http://localhost:3000/ekm](http://localhost:3000/ekm).