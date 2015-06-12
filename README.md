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
**/stations**

*GET*
Serves all the stations currently in the database.

**/stations/top10**

*GET*
Serves top ten stations (and their plugs) ordered by kWh with data to graph.

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
  },
  "events": {
    "0": {
      "count": // number of charges in last seven days for that station,
      "cumulative_kwh": // summative kwh in last seven days for that station,
      "days": [ '6/3', '6/4', '6/5' ] // last seven days MO/DAY
      "plugIns": [ count_for_6/3, count_for_6/4, count_for_6/5 ],
      "kwhGiven": [ cumulative_for_6/3, cumulative_for_6/4, cumulative_for_6/5 ]
    }
  }
}
```

**/stations/cumulative**

*GET*
Serves cumulative data for the entire network since May 16, 2015 with data to graph.

Sample, partial response:
```javascript
{
  "plugIns": // total # of charge events,
  "kwhGiven": // # of kwh given away, to nearest 10ths,
  "graphs": {
    // last seven days
    "plugIns": [ [ timestamp, count ], [], ... ],
    "kwhGiven": [ [ timestamp, cumulative ], [], ... ]
  }
}
```

**/stations/:kin**

*GET*
Serves one station

*POST*
Add station to the database with a given kin.

*PATCH*
Update a station with the given kin.

*PUT*
Kill switch - DO NOT CHANGE!
Update the kill switch status based on kin.

*DELETE*
Delete station to the database with a given kin. Also deletes associated plugs.

**/stations/network/:network**
*GET*
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
**/plugs**
*GET*
Serves all the plugs currently in the database by station id.

*POST*
Adds a plug to the database, associating it with a station.

**/plugs:id**
*GET*
Get one plug based on plug id.

*PATCH*
Get one plug based on plug id.

*DELETE*
Delete one plug based on plug id.

### Station Reports
**/stationReport**
*POST*
Receives and saves a station_report. Responds with 204 No Content.

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
