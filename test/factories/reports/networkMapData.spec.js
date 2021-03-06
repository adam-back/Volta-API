var Q = require( 'q' );
var models = require( '../../../models' );
var moment = require( 'moment' );
moment.utc();
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
      var sevenDaysAgo = moment.utc( "05-01-2016", "MM-DD-YYYY" );
      var listOfChargeEvents = [
        {
          id: 1,
          // 1a - 2a
          time_start: sevenDaysAgo.clone().add( 1, 'hour' ).format(),
          time_stop: sevenDaysAgo.clone().add( 2, 'hours' ).format(),
          kwh: '1.2',
          station_id: 1
        },
        {
          id: 2,
          // 230a-3a
          time_start: sevenDaysAgo.clone().add( 2, 'hours' ).add( 30, 'minutes' ).format(),
          time_stop: sevenDaysAgo.clone().add( 3, 'hours' ).format(),
          kwh: '3.1',
          station_id: 1
        },
        {
          id: 3,
          // 235a-3a
          time_start: sevenDaysAgo.clone().add( 2, 'hours' ).add( 35, 'minutes' ).format(),
          time_stop: sevenDaysAgo.clone().add( 3, 'hours' ).format(),
          kwh: '3.8',
          station_id: 2
        },
        {
          id: 4,
          // Next day, 12a-3a
          time_start: sevenDaysAgo.clone().add( 1, 'day' ).format(),
          time_stop: sevenDaysAgo.clone().add( 1, 'day' ).add( 3, 'hours' ).format(),
          kwh: '100.2',
          station_id: 1
        },
        {
          id: 5,
          // Next day, 1230a-3a
          time_start: sevenDaysAgo.clone().add( 1, 'day' ).add( 30, 'minutes' ).format(),
          time_stop: sevenDaysAgo.clone().add( 1, 'day' ).add( 3, 'hours' ).format(),
          kwh: '7.2',
          station_id: 1
        },
        {
          id: 6,
          // Two days, 1230a-3a
          time_start: sevenDaysAgo.clone().add( 2, 'day' ).add( 30, 'minutes' ).format(),
          time_stop: sevenDaysAgo.clone().add( 2, 'day' ).add( 3, 'hours' ).format(),
          kwh: '0',
          station_id: 1
        }
      ];

      var networksMappedToStations = {
        1: 'Hawaii',
        2: 'Chicago'
      };
      var networks = {
        'Hawaii': true,
        'Chicago': true
      };

      it('should be defined as a function', function() {
        expect( typeof aggregateNetworkMapData ).toBe( 'function' );
      });

      it('should return an object', function() {
        var result = aggregateNetworkMapData( listOfChargeEvents, networksMappedToStations, networks );
        expect( typeof result ).toBe( 'object' );
        expect( Array.isArray( result ) ).toBe( false );
      });

      it('should aggregate Voltaverse (\'all\') data', function() {
        var result = aggregateNetworkMapData( listOfChargeEvents, networksMappedToStations, networks );
        expect( result.hasOwnProperty( 'all' ) ).toBe( true );
        var eight = sevenDaysAgo.clone().subtract( 1, 'days' ).format( 'M/D' );
        var seven = sevenDaysAgo.format( 'M/D' );
        var six = sevenDaysAgo.clone().add( 1, 'days' ).format( 'M/D' );
        var five = sevenDaysAgo.clone().add( 2, 'days' ).format( 'M/D' );

        expect( result.all.days ).toEqual( [ eight, seven, six, five ] );
        expect( result.all.chargeEvents ).toEqual( [ 2, 3, 1, 0 ] );
        expect( result.all.kWh ).toEqual( [ 7.3, 8.1, 7.2, 6.5 ] );
      });

      it('should aggregate specific network data', function() {
        var result = aggregateNetworkMapData( listOfChargeEvents, networksMappedToStations, networks );
        expect( result.hasOwnProperty( 'Hawaii' ) ).toBe( true );
        expect( result.hasOwnProperty( 'Chicago' ) ).toBe( true );

        expect( result.Hawaii.chargeEvents ).toEqual( [ 1, 2, 1, 0 ] );
        expect( result.Hawaii.kWh ).toEqual( [ 3.9, 4.3, 7.2, 6.5 ] );
        expect( result.Chicago.chargeEvents ).toEqual( [ 0, 1, 0, 0 ] );
        expect( result.Chicago.kWh ).toEqual( [ 3.4, 3.8, 0, 0 ] );
      });
    });
  });
};