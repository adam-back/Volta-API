# [The Volta Database](http://volta-api.elasticbeanstalk.com)
<img src="http://s15.postimg.org/9lr5n3wd7/IMG_1936.jpg" alt="Architecture Diagram" width="300" height="300"/>

## API Endpoints

### EKM Data
**/ekm**
Serves a static string

**/ekm/:omnimeterSerialNumber**
Gives a single-day, JSON report of any station

### Stations
**/stations** 
Serves all the stations currently in the database

**/stations/:kin**
Serves one station

**/stations/network/:network**
Serves stations based on network
  - Options include:
    - NoCal : Northern California
    - LA : Los Angeles Area
    - SD : San Diego
    - SB : Santa Barbara Area
    - Arizona
    - Hawaii
    - Chicago

## Stack

- Express
- Sequelize
- PostgreSQL

## Run Locally

### System Requirements

- [Node.js](https://nodejs.org/download/)
- [PostgreSQL 9.3](http://www.postgresql.org/docs/9.3/interactive/installation.html)

### Configure
Run `npm install`.

Create a file in the root directory called `private.js`. This should include:
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

## Deploy Online
(Good luck)

First, create a remote database. Currently, the database is a Amazon RDS PostgreSQL instance. <b>Make sure to change your security settings to allow incoming requests from any IP.</b>

The server itself has been successfully deployed on AWS, Heroku, and Azure. It connects to the remote database with environmental variables: 

- NODE_ENV = production
- APIkey = EKM API key

From RDS:
- DB_USERNAME = Master username
- DB_PASSWORD = Master username password
- DB_NAME = Name of the database
- DB_HOST = Connection endpoint, without the port on the end

```javascript
// good
voltadb.cyq2lc28ysoe.us-west-2.rds.amazonaws.com

// bad
// the default port for PostgreSQl is always 5432
voltadb.cyq2lc28ysoe.us-west-2.rds.amazonaws.com:5432
```
