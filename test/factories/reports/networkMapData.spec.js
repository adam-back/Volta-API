var Q = require( 'q' );
var models = require( '../../../models' );
var moment = require( 'moment' );
moment().format();
var factory = require( '../../../factories/reports/networkMapData.js' );

module.exports = function() {
  describe('networkMapData.js', function() {
    describe('countChargeEventsForNetwork', function() {
      var countChargeEventsForNetwork = factory.countChargeEventsForNetwork;
      var countStations;

      beforeEach(function() {
        countStations = Q.defer();
        spyOn( models.station, 'count' ).andReturn( countStations.promise );
      });

      it('should be defined as a function', function() {
        expect( typeof countChargeEventsForNetwork ).toBe( 'function' );
      });

      it('should return a promise', function() {
        var result = countChargeEventsForNetwork( 'LA' );
        expect( Q.isPromise( result ) ).toBe( true );
      });

      it('should count charge events for a specific network', function( done ) {
        countStations.reject( new Error( 'Test' ) );
        countChargeEventsForNetwork( 'LA' )
        .then(function( value ) {
          expect( value ).not.toBeDefined();
          done();
        })
        .catch(function( error ) {
          expect( models.station.count ).toHaveBeenCalled();
          expect( models.station.count ).toHaveBeenCalledWith( { where: { network: 'LA' }, include: [ { model: models.charge_event } ], raw: true } );
          done();
        });
      });

      it('should return a tuple of network name and count', function( done ) {
        countStations.resolve( 1234 );
        countChargeEventsForNetwork( 'LA' )
        .then(function( value ) {
          expect( value ).toEqual( [ 'LA', 1234 ] );
          done();
        })
        .catch(function( error ) {
          expect( error ).not.toBeDefined();
          done();
        });
      });

      it('should propagate an error', function( done ) {
        countStations.reject( new Error( 'Test' ) );
        countChargeEventsForNetwork( 'LA' )
        .then(function( value ) {
          expect( value ).not.toBeDefined();
          done();
        })
        .catch(function( error ) {
          expect( error.message ).toBe( 'Test' );
          done();
        });
      });
    });

    describe('aggregateNetworkMapData', function() {
      var aggregateNetworkMapData = factory.aggregateNetworkMapData;

      it('should be defined as a function', function() {
        expect( typeof aggregateNetworkMapData ).toBe( 'function' );
      });
    });
  });
};