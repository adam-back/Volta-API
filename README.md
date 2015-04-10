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

### Environmental Variables

Create a file called `private.js`. This should include:

```javascript
module.exports = {
  APIkey: // your key
};
 ```

### Starting the server
1. Start PostgreSQL.
2. `npm start` will start the server.