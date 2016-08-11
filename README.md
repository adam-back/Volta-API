[![Build Status](https://travis-ci.com/Volta-Charging/Database.svg?token=1diC3xzfftT1ypNJZKLa&branch=master)](https://travis-ci.com/Volta-Charging/Database)
# [The Volta Database](http://volta-api.elasticbeanstalk.com)
<img src="https://s3-us-west-2.amazonaws.com/repo-assets/Database+Arch.png" alt="Architecture Diagram" width="400" height="300"/>

There are currently three-ish deployments:

1. [Production](http://volta-api.elasticbeanstalk.com)
  - Master branch, volta-api
1. [Development](http://volta-api-dev.elasticbeanstalk.com)
  - Dev branch, API-dev
1. Kill Switch (deprecated)
  - kill-switch-api
  - This is a single instance, rather than load-balanced.

Current, high-level tech stack:

- Node.js
- Express
- Sequelize
- PostgreSQL
- Async module
- Q promises
- Moment.js

Table schemas can be found in the [models](./models) directory. Associations (f.e. 1-to-Many) can be found in the [index.js](./models/index.js) file. The following image is outdated, but has some of the foundational relationships:
<img src="https://s3-us-west-2.amazonaws.com/repo-assets/relations.png" alt="Relationships" width="500" height="400">

Stars are 'many', 1 is 'one'.

For example, one charge event has many EKM readings.

## API Endpoints

There are public and private endpoints. Private endpoints may only be accessed with an appropriate JWT.

See the [Repo's Wiki](https://github.com/Volta-Charging/Database/wiki) for documentation on the available endpoints. Please add/edit when you make changes; almost every endpoint could be bolstered with response examples.

## Deployment

This repo has a development and master branch corresponding to two different deployments. They automatically deploy, contingent on all tests passing in Travis-CI.

- Dev branch deploys to EKM-API application, API-dev environment.
- Master branch deploys to EKM-API application, volta-api environment.

__Manual Deployment__
(Good luck)

1. Install Elastic-Beanstalk: `pip install awsebcli`.
1. Merge PR on GitHub. Checkout dev or master branch in terminal, depending on where the PR was merged. Rebase to upstream.
1. `eb init`. Select 3, Oregon. Select EKM-API.
1. `eb deploy ` + environment name. If dev, `eb deploy API-dev`. For master, `eb deploy volta-api`. For the single instance, `kill-switch-api`.
1. Wait a while (>5 minutes). Fingers crossed, `eb open`.

__From Scratch__

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
dbname.uniqueId.us-west-2.rds.amazonaws.com

// bad
// the default port for PostgreSQl is always 5432
dbname.uniqueId.us-west-2.rds.amazonaws.com:5432
```

Your own, matching Auth-API. These should match the authentication API's values:

- JWT_SECRET = JSON web token secret string
- JWT_ISSUER = JWT `iss` field to match
- APP_JWT_SECRET = JWT web token secret string for requests from App-Server

## Run Locally

### System Requirements

- [Node.js](https://nodejs.org/download/)
- [PostgreSQL 9.3](http://www.postgresql.org/docs/9.3/interactive/installation.html)

### Configure
Run `npm install` in the root directory.

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

### Testing

1. Install grunt: `npm install grunt-cli -g`.
1. Ensure that you're `config.js` file's development variables are set to a **local** database.
1. `grunt test` from the root directory.

### Starting the server

1. Start PostgreSQL.
1. Run `npm start` from the terminal.
1. Open a browser to [http://localhost:3000/stations](http://localhost:3000/stations).

### Workflow
See the [contribution guide](https://github.com/Volta-Charging/Project-Management/blob/master/contributing.md). Note: there is a dev and a master branch on this project, each with their own deployments.
