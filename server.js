var express      = require( 'express' );
var path         = require( 'path' );
var favicon      = require( 'serve-favicon' );
var logger       = require( 'morgan' );
var cookieParser = require( 'cookie-parser' );
var bodyParser   = require( 'body-parser' );
var expressSanitizer = require( 'express-sanitizer' );
var unless           = require( 'express-unless' );
var http             = require( 'http' );
var env              = process.env.NODE_ENV || 'development';
var jwt              = require( 'express-jwt' );
var jwtSecret        = require( './config/config' )[ env ].secret;
var issuer           = require( './config/config' )[ env ].issuer;

var app = express();

var jwtCheck = jwt( { secret: jwtSecret, issuer: issuer } );

var server = http.createServer( app );
var io = require( 'socket.io' )( server );
module.exports = exports = { io: io };

// Configuration
app.use( '/protected', jwtCheck );
app.use( logger( 'dev' ) );
app.use( bodyParser.json() );
app.use( bodyParser.urlencoded( { extended: false } ) );
app.use( expressSanitizer() );
app.use( cookieParser() );

// Allow CORS
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE, PATCH");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

////
// Public
////

// Route handling
var stationRoutes = require( './routes/public/stationRoutes' );
var plugRoutes = require( './routes/public/plugRoutes' );
var reportRoutes = require( './routes/public/stationReportRoutes' );
var scheduleRoutes = require( './routes/public/scheduleRoutes' );
var imageRoutes = require( './routes/public/stationImageRoutes' );

// Routes
app.use( '/stations', stationRoutes );
app.use( '/plugs', plugRoutes );
app.use( '/stationReport', reportRoutes );
app.use ('/stationSchedule', scheduleRoutes);
// app.use ('/stationImages', imageRoutes);

////
// Authentication Required
////

// Route handling
var protectedStationRoutes = require( './routes/protected/protectedStationRoutes' );
var protectedPlugRoutes = require( './routes/protected/protectedPlugRoutes' );
var protectedNetworkRoutes = require( './routes/protected/protectedNetworkRoutes' );
var protectedAppRoutes = require( './routes/protected/protectedAppRoutes' );
var protectedAppUserRoutes = require( './routes/protected/protectedAppUserRoutes' );
var protectedAppFavoriteRoutes = require( './routes/protected/protectedAppFavoriteRoutes' );
var protectedMediaScheduleRoutes = require( './routes/protected/protectedMediaScheduleRoutes' );
var protectedMediaPresentationRoutes = require( './routes/protected/protectedMediaPresentationRoutes' );
var protectedMediaSlideRoutes = require( './routes/protected/protectedMediaSlideRoutes' );
var protectedReportRoutes = require( './routes/protected/protectedReportRoutes' );
var protectedD3Routes = require( './routes/protected/protectedD3Routes' );

// Routes
app.use( '/protected/station', protectedStationRoutes );
app.use( '/protected/station/network', protectedNetworkRoutes );
app.use( '/protected/plug', protectedPlugRoutes );
app.use( '/protected/app', protectedAppRoutes );
app.use( '/protected/app/user', protectedAppUserRoutes );
app.use( '/protected/app/favorites', protectedAppFavoriteRoutes );

app.use( '/protected/mediaSchedule', protectedMediaScheduleRoutes );
// app.use( '/mediaSchedule', protectedMediaScheduleRoutes );
app.use( '/protected/mediaPresentation', protectedMediaPresentationRoutes );
app.use( '/protected/mediaSlide', protectedMediaSlideRoutes );
app.use( '/protected/reports', protectedReportRoutes );
app.use( '/protected/D3', protectedD3Routes );

app.get('*', function( req, res ){
  res.status( 404 ).send( 'I\'m afraid I can\'t do that, Hal.' );
});

////////////////////////////
// Server startup
////////////////////////////

var port = process.env.PORT || 3000;
app.set( 'port', port );

//Socket.io Settings
var heartbeatInterval = 3600*1000; // 1 Hour in milliseconds
io.set('close timeout', 0);
io.set('heartbeat timeout', heartbeatInterval);
io.set('heartbeat interval', heartbeatInterval/2); // 30 Minutes in milliseconds

// io.set('heartbeat timeout', 10000);
// io.set('heartbeat interval', 10000);

// console.log('timeout: ', io.engine.pingTimeout, ' interval: ', io.engine.pingInterval);

// console.log('eio: ', io.eio);
// io.eio.pingInterval = heartbeatInterval;
// io.eio.pingTimeout = heartbeatInterval*2;
// io.eio.transports = ['websocket'];


// io.engine.pingInterval = heartbeatInterval;
// io.engine.pingTimeout = heartbeatInterval*2;
// io.engine.transports = ['websocket'];


// Create listeners
server.on( 'error', function() {
  console.error( 'Server error.' );
});

server.on('listening', function() {
  console.log( 'Server listening on port:', port );
});

server.listen( port );
server.listen( 443 );
 