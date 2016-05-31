var models = require( '../../../../models');
var factory = require( '../../../../factories/reports/networkMapData.js' );
var Q = require( 'q' );
var async = require( 'async' );
var moment = require( 'moment' );
moment().format();
var supertest = require( 'supertest' );
var app = require( '../../../../server.js' ).app;
supertest = supertest( app );

var createToken = require( '../../../jwtHelper' ).createToken;
var token = createToken();

module.exports = function() {
  describe('NETWORK ROUTES', function() {
    describe('station/network/map', function() {
      var route = '/protected/station/network/map';

      describe('GET', function() {
        var findAllStations, findChargeEvents, countAllChargeEvents, countLAChargeEvents, countHawaiiChargeEvents, countChicacoChargeEvents;
        var stations, chargeEvents;

        beforeEach(function() {
          findAllStations = Q.defer();
          findChargeEvents = Q.defer();
          countAllChargeEvents = Q.defer();
          countLAChargeEvents = Q.defer();
          countHawaiiChargeEvents = Q.defer();
          countChicagoChargeEvents = Q.defer();

          spyOn( models.station, 'findAll' ).andReturn( findAllStations.promise );
          spyOn( models.charge_event, 'findAll' ).andReturn( findChargeEvents.promise );
          spyOn( factory, 'aggregateNetworkMapData' ).andReturn({
            all: {
              days: [],
              chargeEvents: [],
              kWh: []
            },
            Hawaii: {
              chargeEvents: [],
              kWh: []
            },
            LA: {
              chargeEvents: [],
              kWh: []
            },
            Chicago: {
              chargeEvents: [],
              kWh: []
            },
          });
          spyOn( models.charge_event, 'count' ).andReturn( countAllChargeEvents.promise );
          spyOn( factory, 'countChargeEventsForNetwork' ).andCallFake(function( network ) {
            if ( network === 'LA' ) {
              return countLAChargeEvents.promise;
            } else if ( network === 'Hawaii' ) {
              return countHawaiiChargeEvents.promise;
            } else if ( network === 'Chicago' ) {
              return countChicagoChargeEvents.promise;
            } else {
              return void( 0 );
            }
          });

          stations = [
            {
              id: 1,
              network: 'Hawaii',
              cumulative_kwh: '23.3'
            },
            {
              id: 2,
              network: 'Chicago',
              cumulative_kwh: '3.1'
            },
            {
              id: 3,
              network: 'Chicago',
              cumulative_kwh: '2.2'
            },
            // no network
            {
              id: 4,
              cumulative_kwh: '1.6'
            },
            // no kWh
            {
              id: 5,
              network: 'LA'
            }
          ];
          chargeEvents = [
            // seven days ago @ 12a to 1a for 1 hour
            {
              time_start: moment().subtract( 7, 'days' ).startOf( 'day' ).toDate(),
              time_stop: moment().subtract( 7, 'days' ).startOf( 'day' ).add( 1, 'hours' ).toDate(),
              kwh: '5.2',
              station_id: 1
            },
            // seven days ago @ 4a to 4:30a for 30 minutes
            {
              time_start: moment().subtract( 7, 'days' ).startOf( 'day' ).add( 4, 'hours' ).toDate(),
              time_stop: moment().subtract( 7, 'days' ).startOf( 'day' ).add( 4, 'hours' ).add( 30, 'minutes' ).toDate(),
              kwh: '2',
              station_id: 1
            },
            // five days ago @ 12:30a to 1a for 30 minutes
            {
              time_start: moment().subtract( 5, 'days' ).startOf( 'day' ).add( 30, 'minutes' ).toDate(),
              time_stop: moment().subtract( 5, 'days' ).startOf( 'day' ).add( 1, 'hours' ).toDate(),
              kwh: '1.6',
              station_id: 2
            }
          ];
        });

        it('should be a defined route (not 404)', function( done ) {
          findAllStations.reject( new Error( 'Test' ) );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( res.statusCode ).not.toBe( 404 );
          })
          .end( done );
        });

        it('should find all stations', function( done ) {
          findAllStations.reject( new Error( 'Test' ) );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( models.station.findAll ).toHaveBeenCalled();
            expect( models.station.findAll ).toHaveBeenCalledWith( { attributes: [ 'id', 'network', 'cumulative_kwh' ], raw: true } );
          })
          .end( done );
        });

        it('should find charge events for last 7 days', function( done ) {
          var sevenDaysAgo = moment.utc().startOf( 'day' ).subtract( 7, 'days' );

          findAllStations.resolve( true );
          findChargeEvents.reject( new Error( 'Test' ) );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( models.charge_event.findAll ).toHaveBeenCalled();
            expect( models.charge_event.findAll ).toHaveBeenCalledWith( { where: { time_start: { $gt: sevenDaysAgo.format(), $lt: moment.utc().startOf( 'day' ).format() }, time_stop: { $ne: null } }, order: 'time_start', raw: true } );
          })
          .end( done );
        });

        it('should format data for the graph', function( done ) {
          var networkLookupByStation = {
            1: 'Hawaii',
            2: 'Chicago',
            3: 'Chicago',
            5: 'LA'
          };
          var uniqueNetworks = {
            'Hawaii': true,
            'Chicago': true,
            'LA': true
          };
          findAllStations.resolve( stations );
          findChargeEvents.resolve( chargeEvents );
          countAllChargeEvents.reject( new Error ( 'Test' ) );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( factory.aggregateNetworkMapData ).toHaveBeenCalled();
            expect( factory.aggregateNetworkMapData ).toHaveBeenCalledWith( chargeEvents, networkLookupByStation, uniqueNetworks );
          })
          .end( done );
        });

        it('should count charge events for all networks', function( done ) {
          findAllStations.resolve( stations );
          findChargeEvents.resolve( chargeEvents );
          countAllChargeEvents.resolve( 50 );
          countLAChargeEvents.reject( new Error( 'Test' ) );

          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( models.charge_event.count ).toHaveBeenCalled();
            expect( models.charge_event.count ).toHaveBeenCalledWith();
            expect( factory.countChargeEventsForNetwork.calls.length ).toBe( 3 );
            var networks = [ 'Hawaii', 'Chicago', 'LA' ];
            var index = networks.indexOf( factory.countChargeEventsForNetwork.calls[ 0 ].args[ 0 ] );
            expect( index ).not.toBe( -1 );
            networks.splice( index, 1 );
            index = networks.indexOf( factory.countChargeEventsForNetwork.calls[ 1 ].args[ 0 ] );
            expect( index ).not.toBe( -1 );
            networks.splice( index, 1 );
            index = networks.indexOf( factory.countChargeEventsForNetwork.calls[ 2 ].args[ 0 ] ); 
            expect( index ).not.toBe( -1 );
          })
          .end( done );
        });

        it('should add cumulatives to the networks and return JSON', function( done ) {
          findAllStations.resolve( stations );
          findChargeEvents.resolve( chargeEvents );
          countAllChargeEvents.resolve( 1000 );
          countLAChargeEvents.resolve( [ 'LA', 150 ] );
          countHawaiiChargeEvents.resolve( [ 'Hawaii', 50 ] );
          countChicagoChargeEvents.resolve( [ 'Chicago', 2 ] );

          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 200 )
          .expect( 'Content-Type', /json/ )
          .expect(function( res ) {
            var keys = Object.keys( res.body );
            expect( keys.length ).toBe( 4 );
            expect( res.body.hasOwnProperty( 'LA' ) ).toBe( true );
            expect( res.body.LA.totalChargeEvents ).toBe( 150 );
            expect( res.body.LA.cumulativeKwh ).toBe( 0 );
            expect( res.body.hasOwnProperty( 'Hawaii' ) ).toBe( true );
            expect( res.body.Hawaii.totalChargeEvents ).toBe( 50 );
            expect( res.body.Hawaii.cumulativeKwh ).toBe( 23 );
            expect( res.body.hasOwnProperty( 'Chicago' ) ).toBe( true );
            expect( res.body.Chicago.totalChargeEvents ).toBe( 2 );
            expect( res.body.Chicago.cumulativeKwh ).toBe( 5 );
          })
          .end( done );
        });

        it('should return 500 failure for error', function( done ) {
          findAllStations.reject( new Error( 'Test' ) );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 500 )
          .expect( 'Content-Type', /text/ )
          .expect( 'Test' )
          .expect(function( res ) {
            expect( models.station.findAll ).toHaveBeenCalled();
          })
          .end( done );
        });
      });
    });
  });
};