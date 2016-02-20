var config    = require( '../../../../config/config' ).development;
var Q = require( 'q' );
var async     = require( 'async' );
var models = require( '../../../../models' );
var controller = require( '../../../../controllers/protected/app.protectedController.js' );
var geocodeCache = require( '../../../../factories/geocodeCache.js' ).geocodeCache;
var distance = require( '../../../../factories/distanceFactory.js' );
var geocoder = require( 'node-geocoder' )( 'google', 'https', { apiKey: config.googleApiKey, formatter: null } );

module.exports = function() {
  describe('APP HELPERS', function() {
    describe('countStationAvailability', function() {
      var countStationAvailability = controller.countStationAvailability;
      var usageCollection = [ 'true', 'false', 'null' ];

      it('should be defined as a function', function() {
        expect( typeof countStationAvailability ).toBe( 'function' );
      });

      it('should return a number', function() {
        var numberAvailable = countStationAvailability( usageCollection );
        expect( typeof numberAvailable ).toBe( 'number' );
      });

      it('should count number of available plugs', function() {
        var numberAvailable = countStationAvailability( usageCollection );
        expect( numberAvailable ).toBe( 1 );
      });

      it('should return 0 if no plugs', function() {
        expect( countStationAvailability( [] ) ).toBe( 0 );
      });
    });

    describe('findDistances', function() {
      var findDistances = controller.findDistances;
      var userCoords = [ '1', '2' ];
      var favorites = [ { id: 1, gps: [ '5, 6' ] }, { id: 2, gps: [ '7, 8' ] } ];
      var result;

      beforeEach(function() {
        spyOn( distance, 'getDistanceFromLatLonInMiles' ).andReturn( 5 );
      });

      afterEach(function() {
        result = undefined;
      });

      it('should be defined as a function', function() {
        expect( typeof findDistances ).toBe( 'function' );
      });

      it('should return an array', function() {
        result = findDistances( userCoords, favorites );
        expect( Array.isArray( result ) ).toBe( true );
      });

      it('should add distance to the stations', function() {
        result = findDistances( userCoords, favorites );
        expect( distance.getDistanceFromLatLonInMiles.calls.length ).toBe( 2 );
        expect( distance.getDistanceFromLatLonInMiles.calls[ 0 ].args ).toEqual( [ userCoords, favorites[ 0 ].gps ] );
        expect( distance.getDistanceFromLatLonInMiles.calls[ 1 ].args ).toEqual( [ userCoords, favorites[ 1 ].gps ] );
        for ( var i = 0; i < result.length; i++ ) {
          expect( result[ i ].hasOwnProperty( 'distance' ) ).toBe( true );
          expect( result[ i ].distance ).toBe( 5 );
        }
      });
    });

    describe('connectStationsWithPlugsAndSponsors', function() {
      var connectStationsWithPlugsAndSponsors = controller.connectStationsWithPlugsAndSponsors;

      it('should be defined as a function', function() {
        expect( typeof connectStationsWithPlugsAndSponsors ).toBe( 'function' );
      });
    });

    describe('attachImages', function() {
      var attachImages = controller.attachImages;

      it('should be defined as a function', function() {
        expect( typeof attachImages ).toBe( 'function' );
      });
    });

    describe('groupByKin', function() {
      var groupByKin = controller.groupByKin;

      it('should be defined as a function', function() {
        expect( typeof groupByKin ).toBe( 'function' );
      });
    });

    describe('geocodeGroupsWithoutGPS', function() {
      var geocodeGroupsWithoutGPS = controller.geocodeGroupsWithoutGPS;

      it('should be defined as a function', function() {
        expect( typeof geocodeGroupsWithoutGPS ).toBe( 'function' );
      });
    });
  });
};