# [The Volta Database](http://volta-api.elasticbeanstalk.com)
<img src="https://s3-us-west-2.amazonaws.com/repo-assets/Database+Arch.png" alt="Architecture Diagram" width="400" height="300"/>

## Table Schemas
- Car
- User
- Charge Event
- EKMreading
- Station
- Plug
- Rating
- Report
- Weather Report

## Relationships
<img src="https://s3-us-west-2.amazonaws.com/repo-assets/relations.png" alt="Relationships" width="500" height="400">

Stars are 'many', 1 is 'one'.

For example, one charge event has many EKM readings.

## API Endpoints

### EKM Data
**GET /ekm**
Serves a static string

**GET /ekm/:omnimeterSerialNumber**
Not currently implemented
Gives a single-day, JSON report of any station

### Stations
**GET /stations**
Serves all the stations currently in the database

**GET /stations/top10**
Serves top ten stations (and their plugs) ordered by kWh.

Sample, partial response:
```javascript
{
  "stations": {
    "0": // most used station,
    "1": // second most used station, ...
  },
  "plugs": {
    "0": // plug for most used station,
    "1": // plug for second most used station...
  }
}
```

**GET /stations/:kin**
Serves one station

**GET /stations/network/:network**
Serves stations based on network
  - Options include:
    - NoCal : Northern California
    - LA : Los Angeles Area
    - SD : San Diego
    - SB : Santa Barbara Area
    - Arizona
    - Hawaii
    - Chicago

### Plugs
**GET /plugs**
Serves all the plugs currently in the database by station id.

**GET /plugs/:stationId**
Serves the plugs associated with the station id.

### Station Reports
**POST /stationReport**
Receives and saves a station_report. Responds with 204 No Content.

### Adam Likes Tea
**GET /imalittleteapot**
Returns a cuppa' tea.

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

Create a local PostgreSQL database using with the name `volta`. Fill the 'development' object in `config/config.js` with your own information:
```javascript
// change these
'username': 'someRootUsername',
'password': 'yourLocalDBPW',
// these stay the same
'database': 'volta',
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
