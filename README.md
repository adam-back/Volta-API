# [The Volta Database](http://volta-api.elasticbeanstalk.com)
<img src="https://s3-us-west-2.amazonaws.com/repo-assets/Database+Arch.png" alt="Architecture Diagram" width="400" height="300"/>

There are currently three deployments:

1. [Production](http://volta-api.elasticbeanstalk.com)
  - Master branch
  - `eb deploy volta-api`
2. [Development](http://volta-api-dev.elasticbeanstalk.com)
  - Dev branch
  - `eb deploy API-dev`
3. Kill Switch
  - `eb deploy kill-switch-api`
  - This is a single instance, rather than load-balanced.

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
There are public and private endpoints. Private endpoints may only be accessed with an appropriate JWT.

### Public
#### Stations
**GET /stations**
Serves all the stations currently in the database.

**GET /stations/:kin**
Kill switch - DO NOT CHANGE!
Get the kill switch status based on kin.

**PUT /stations/:kin**
Kill switch - DO NOT CHANGE!
Update the kill switch status based on kin.

#### Plugs
**GET /plugs**
Serves all the plugs currently in the database, collected into a JSON object by station id.

#### Station Reports
**POST /stationReport**
Receives and saves a station_report. Responds with 204 No Content.

#### Station Schedules
**GET /stationSchedule**
Gets all stations' schedules.

**GET /stationSchedule/:kin**
Gets one station's schedule.

**PUT /stationSchedule/:kin**
Sets one station's schedule.

### Private
All private endpoints are prepended with `/protected/` and are checked by JWT.

#### Stations
**/protected/station**
*GET*
Serves all stations. Note, this is a duplicate of the same public route. The public route is for legacy purposes.

*POST*
Add station to the database.

*PATCH*
Update a station.

**GET /protected/station/count**
Count the number of stations in the system.

**/protected/station/:kin**
*GET*
Serves one station based on the kin.

*DELETE*
Delete station to the database with a given kin. Also deletes associated plugs.

*PUT*
Set one station's kill switch status based on the kin.

#### Network
**GET protected/station/network/top10**
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

**GET protected/station/network/cumulative**
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

**GET protected/station/network/:network**
Serves stations based on network
  - Options include:
    - NoCal : Northern California
    - LA : Los Angeles Area
    - SD : San Diego
    - SB : Santa Barbara Area
    - Arizona
    - Hawaii
    - Chicago

#### Plugs
**/protected/plug**
*GET*
Serves all the plugs currently in the database by station id. Note, this is a duplicate of the same public route. The public route is for legacy purposes.

*POST*
Adds a plug to the database, associating it with a station.

*PATCH*
Update a plug.

**protected/plug/:id**
*GET*
Get one plug based on plug id.

*DELETE*
Delete one plug based on plug id.

#### App
Endpoints for the Android and iOS apps.

**GET protected/app/stations**
Collects the stations and plugs in a format easily displayed by the Ionic app. Also takes a querystring of the user's location to estimate distance.

**POST protected/app/stationReport**
Save a user-submitted report, comment, or suggestion.

**GET protected/app/sponsors**
Get the sponsors for the sponsorship page.

#### App User
**POST protected/app/user/create**
Creates a user with email address and password. No other info is collected at this time.

**POST protected/app/user/authenticate**
Takes user credentials, authenticates if possible, returning a JWT.

**POST protected/app/user/resetPassword**
Verifies that there is user in the system, returning email and id to App-Server so that it may send a reset email.

**PATCH protected/app/user/resetPassword**
Takes direct input from App-Server to set new password for user.

#### App Favorites
**protected/app/favorites**
*GET*
Uses the id in the querystring to find a user's favorited stations.

*POST*
Adds a station to the user's favorites.

*PATCH*
Removes a station from the user's favorite. Did not use DELETE, because we're not deleting a resource, just modifying a list.

#### Reports
**GET**
*protected/reports/dashboard*
Get data for the Station-Manager dashboard, including:
- Cumulative kWh
  - Number of trees
  - Carbon offset
  - Number of miles
  - Number of gallons of gas
- Number of charge events
- Last 10 charge events
- Graph data for:
  - Broken stations
  - In-use stations
  - Stations without GPS coordinates

*protected/reports/broken/:output*
Returns and array of plugs and their associated stations which currently have meter_status of 'error'. Fields:
- kin
- location
- location_address
- network
- ekm_omnimeter_serial
- ekm_push_mac
- number_on_station

Can return for web display or as CSV.

*protected/reports/one/:kin*
In-progress. Will return report data for one station.

*protected/reports/withoutCoordiates/:output*
Returns the stations without GPS coordinates for web display or as CSV.

*protected/reports/wrongCoordinates/:output*
Gets the stations with GPS coordinates, then runs the stations' addresses through the Google geocode API. It then compares the save coordinates with what Google thinks they should be, throwing a flag on anything that has more than one mile difference. Returns for web display or csv.

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


Create a local PostgreSQL database using with the name `volta`. Fill the 'development' object in `config/config.js` with your own information:
```javascript
// change these
'username': 'someRootUsername',
'password': 'yourLocalDBPW',
'googleApiKey': 'dev google api server key',
'ekmApiKey': 'our EKM key'
// these stay the same
'database': 'volta',
'host': '127.0.0.1',
'dialect': 'postgres',
'port': 5432,
'secret': 'iamallama',
'issuer': 'seniorllama'
'appSecret': 'notsosecret',
```

### Starting the server
1. Start PostgreSQL.
1. Run `npm start` from the terminal.
1. Open a browser to [http://localhost:3000/stations](http://localhost:3000/stations).

#### Workflow
See the [contribution guide](https://github.com/Volta-Charging/Project-Management/blob/master/contributing.md). Note: there is a dev and a master branch on this project, each with their own deployments.

#### Deploying Changes
This repo has a development and master branch corresponding to two different deployments.
1. Merge PR on GitHub. Checkout dev or master branch in terminal, depending on where the PR was merged. Rebase to upstream.
2. `eb init`. Select 3, Oregon. Select EKM-API.
3. `eb deploy ` + environment name. If dev, `eb deploy API-dev`. For master, `eb deploy volta-api`. For the single instance, `kill-switch-api`.
4. Wait a while (>5 minutes). Fingers crossed, `eb open`.

## Deploy Online
(Good luck)

First, create a remote database. Currently, the database is a Amazon RDS PostgreSQL instance. <b>Make sure to change your security settings to allow incoming requests from any IP.</b>

The server itself has been successfully deployed on AWS, Heroku, and Azure. It connects to the remote database with environmental variables:

- NODE_ENV = production
- EKM_API_KEY = ekm key
- GOOGLE_API_KEY = server-side key

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

Your own, matching Auth-API:
These should match the authentication API's values.
- JWT_SECRET = JSON web token secret string
- JWT_ISSUER = JWT `iss` field to match

- APP_JWT_SECRET = JWT web token secret string for requests from App-Server

