var express = require( 'express' );
var path = require( 'path' );
var favicon = require( 'serve-favicon' );
var logger = require( 'morgan' );
var cookieParser = require( 'cookie-parser' );
var bodyParser = require( 'body-parser' );
var expressSanitizer = require( 'express-sanitizer' );
var http = require( 'http' );

var app = express();

// Configuration
app.use( logger( 'dev' ) );
app.use( bodyParser.json() );
app.use( bodyParser.urlencoded( { extended: false } ) );
app.use( expressSanitizer() );
app.use( cookieParser() );

// Allow CORS
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// Route handling
var ekmRoutes = require( './routes/ekmRoutes' );
var stationRoutes = require( './routes/stationRoutes' );
var plugRoutes = require( './routes/plugRoutes' );
var reportRoutes = require( './routes/stationReportRoutes' );

app.use( '/ekm', ekmRoutes );
app.use( '/stations', stationRoutes );
app.use( '/plugs', plugRoutes );
app.use( '/stationReport', reportRoutes );

app.get('*', function( req, res ){
  res.send( 'I\'m afraid I can\'t do that, Hal.', 404 );
});

////////////////////////////
// Server startup
////////////////////////////

var port = process.env.PORT || 3000;
app.set( 'port', port );

var server = http.createServer( app );
var io = require( 'socket.io' )( server );
console.log( 'server io: ', io );

//Socket.io Settings
var heartbeatInterval = 86400000; // 1 Day in milliseconds
io.set('close timeout', 0);
io.set('heartbeat timeout', heartbeatInterval*2);
io.set('heartbeat interval', heartbeatInterval);


// console.log('eio: ', io.eio);
// io.eio.pingInterval = heartbeatInterval;
// io.eio.pingTimeout = heartbeatInterval*2;
// io.eio.transports = ['websocket'];


// io.engine.pingInterval = heartbeatInterval;
// io.engine.pingTimeout = heartbeatInterval*2;
// io.engine.transports = ['websocket'];

module.exports = { io: io };

// Create listeners
server.on( 'error', function() {
  console.error( 'Server error.' );
});

server.on('listening', function() {
  console.log( 'Server listening on port:', port );
});

server.listen( port );
 