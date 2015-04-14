var child_process = require( 'child_process' );
var express = require( 'express' );
var path = require( 'path' );
var favicon = require( 'serve-favicon' );
var logger = require( 'morgan' );
var cookieParser = require( 'cookie-parser' );
var bodyParser = require( 'body-parser' );
var http = require( 'http' );
var sequelize = require( 'sequelize' );
var models = require( './models');

var app = express();

// Configuration
app.use( logger( 'dev' ) );
app.use( bodyParser.json() );
app.use( bodyParser.urlencoded( { extended: false } ) );
app.use( cookieParser() );

// Route handling
var ekmRoutes = require( './routes/ekmRoutes' );

app.use( '/ekm', ekmRoutes );

app.get('*', function( req, res ){
  res.send( 'I\'m afraid I can\'t do that, Hal', 404 );
});

////////////////////////////
// Server startup
////////////////////////////

var port = process.env.PORT || 3000;
app.set( 'port', port );

var server = http.createServer( app );

// Create listeners
server.on( 'error', function() {
  console.error( 'Server error.' );
});

server.on('listening', function() {
  console.log( 'Server listening on port:', port );
});

// Syncronize the models
models.sequelize.sync()
  // when sucessful
  .then(function() {
    // start to listen
  });

server.listen( port );
 