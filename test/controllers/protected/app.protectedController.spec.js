var supertest = require( 'supertest' );
var app = require( '../../../server.js' );
var io = app.io;
app = app.app;
supertest = supertest( app );
var config    = require( '../../../config/config' ).development;
var Q = require( 'q' );
var async     = require( 'async' );
var models = require( '../../../models' );

var geocodeCache = require( '../../../factories/geocodeCache.js' ).geocodeCache;
var calculateDistance = require( '../../../factories/distanceFactory.js' ).getDistanceFromLatLonInMiles;
var createToken = require( '../../jwtHelper' ).createToken;
var token = createToken( 5 );
var geocoder = require( 'node-geocoder' )( 'google', 'https', { apiKey: config.googleApiKey, formatter: null } );

module.exports = function() {
  describe('APP ROUTES', function() {
    describe('app/stations', function() {
      var route = '/protected/app/stations';

      describe('GET', function() {
        it('should be defined as a protected route', function( done ) {
          supertest.get( route )
          .expect( 401 )
          .end( done );
        });
      });
    });

    describe('app/stationReport', function() {
      var route = '/protected/app/stationReport';

      describe('POST', function() {
        it('should be defined as a protected route', function( done ) {
          supertest.post( route )
          .expect( 401 )
          .end( done );
        });
      });
    });

    describe('app/sponsors', function() {
      var route = '/protected/app/sponsors';

      describe('GET', function() {
        it('should be defined as a protected route', function( done ) {
          supertest.get( route )
          .expect( 401 )
          .end( done );
        });
      });
    });
  });
};