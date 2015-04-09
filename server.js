var express        = require( 'express' );
var app            = express();
var bodyParser     = require( 'body-parser' );
var port           = process.env.PORT || 3000;

var allowCrossDomain = function( req, res, next ) {
    res.header( 'Access-Control-Allow-Origin', '*' );
    res.header( 'Access-Control-Allow-Methods', 'GET,POST' );
    res.header( 'Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With' );
    next();
}
;
app.use( bodyParser.json() );
app.use( allowCrossDomain );
app.use( express.static( __dirname + '/public' ) );

var EKMRouter = express.Router();

var routers = {};

routers.EKMRouter = EKMRouter;

require( './config.js' )( app, express, routers );

require( './EKM/ekmRoutes.js' )( EKMRouter );

app.listen(port);
console.log( 'Volta server running on port:',  port );
exports = module.exports = app;