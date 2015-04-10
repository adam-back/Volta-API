# Database
Volta Database Schemas using Sequelize

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