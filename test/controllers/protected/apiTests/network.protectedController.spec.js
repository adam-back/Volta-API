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
        var findAllStations, findChargeEvents, countAllChargeEvents, countChargeEventsByNetwork, chargeEvents;

        beforeEach(function() {
          findAllStations = Q.defer();
          findChargeEvents = Q.defer();
          countAllChargeEvents = Q.defer();
          countChargeEventsByNetwork = Q.defer();

          spyOn( models.station, 'findAll' ).andReturn( findAllStations.promise );
          spyOn( models.charge_event, 'findAll' ).andReturn( findChargeEvents.promise );
          spyOn( factory, 'aggregateNetworkMapData' ).andCallThrough();
          spyOn( models.charge_event, 'count' ).andReturn( countAllChargeEvents.promise );
          spyOn( factory, 'countChargeEventsForNetwork' ).andReturn( countChargeEventsByNetwork.promise );
          chargeEvents = [];
          // seven days ago @ 12a to 1a for 1 hour
          chargeEvents.push( { time_start: moment().subtract( 7, 'days' ).startOf( 'day' ).toDate(), time_stop: moment().subtract( 7, 'days' ).startOf( 'day' ).add( 1, 'hours' ).toDate(), kwh: 5, station_id: 1 } );
          // seven days ago @ 4a to 4:30a for 30 minutes
          chargeEvents.push( { time_start: moment().subtract( 7, 'days' ).startOf( 'day' ).add( 4, 'hours' ).toDate(), time_stop: moment().subtract( 7, 'days' ).startOf( 'day' ).add( 4, 'hours' ).add( 30, 'minutes' ).toDate(), kwh: 2, station_id: 1 } );
          // five days ago @ 12:30a to 1a for 30 minutes
          chargeEvents.push( { time_start: moment().subtract( 5, 'days' ).startOf( 'day' ).add( 30, 'minutes' ).toDate(), time_stop: moment().subtract( 5, 'days' ).startOf( 'day' ).add( 1, 'hours' ).toDate(), kwh: 3.5, station_id: 1 } );
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

        xit('should return json after calculating graph data', function( done ) {
          countEvents.resolve( 3 );
          sumKwh.resolve( 10.5 );
          findChargeEvents.resolve( chargeEvents );
          var expectedOutput = {
            plugIns: 3,
            kwhGiven: 10.5,
            graphs: {
              days: [ moment( chargeEvents[ 0 ].time_start ).format( 'M[/]D' ), moment( chargeEvents[ 2 ].time_start ).format( 'M[/]D' ) ],
              plugIns: [ 2, 1 ],
              kwhGiven: [ 7, 3.5 ]
            }
          };

          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 200 )
          .expect( 'Content-Type', /json/ )
          .expect( expectedOutput )
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