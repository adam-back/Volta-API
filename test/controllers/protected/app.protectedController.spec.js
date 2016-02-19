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
    describe('app/', function() {
      var route = '/protected/app';

      it('should be true', function() {
        expect( true ).toBe( true );
      });
    });
  });
};