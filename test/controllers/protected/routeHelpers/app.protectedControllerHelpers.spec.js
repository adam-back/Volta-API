var config    = require( '../../../../config/config' ).development;
var Q = require( 'q' );
var async     = require( 'async' );
var models = require( '../../../../models' );
var controller = require( '../../../../controllers/protected/app.protectedController.js' );
var geocodeCache = require( '../../../../factories/geocodeCache.js' ).geocodeCache;
var calculateDistance = require( '../../../../factories/distanceFactory.js' ).getDistanceFromLatLonInMiles;
var geocoder = require( 'node-geocoder' )( 'google', 'https', { apiKey: config.googleApiKey, formatter: null } );

module.exports = function() {
  describe('APP HELPERS', function() {
    describe('countStationAvailability', function() {
      var countStationAvailability = controller.countStationAvailability;

      it('should be defined as a function', function() {
        expect( typeof countStationAvailability ).toBe( 'function' );
      });
    });
  });
};