var models = require( '../../../../models');
var Q = require( 'q' );
var async = require( 'async' );
var moment = require( 'moment' );
moment().format();
var supertest = require( 'supertest' );
var app = require( '../../../../server.js' ).app;
supertest = supertest( app );

var createToken = require( '../../../jwtHelper' ).createToken;
var token = createToken( 5 );

module.exports = function() {
  describe('NETWORK ROUTES', function() {
    describe('station/network/top10', function() {
      var route = '/protected/station/network/top10';

      describe('GET', function() {
        var findStations, station1, station2, getStation1Plugs, getStation2Plugs, plug1, plug2, countChargeEvents1, countChargeEvents2, findChargeEvents1, findChargeEvents2, chargeEvents1, chargeEvents2;

        beforeEach(function() {
          findStations = Q.defer();
          station1 = models.station.build( { id: 1, cumulative_kwh: 10.5 } );
          station2 = models.station.build( { id: 2, cumulative_kwh: 4 } );
          getStation1Plugs = Q.defer();
          getStation2Plugs = Q.defer();
          plug1 = { id: 3 };
          plug2 = { id: 4 };
          countChargeEvents1 = Q.defer();
          countChargeEvents2 = Q.defer();
          findChargeEvents1 = Q.defer();
          findChargeEvents2 = Q.defer();
          spyOn( models.station, 'findAll' ).andReturn( findStations.promise );
          spyOn( station1, 'getPlugs' ).andReturn( getStation1Plugs.promise );
          spyOn( station2, 'getPlugs' ).andReturn( getStation2Plugs.promise );
          spyOn( models.charge_event, 'count' ).andCallFake(function( query ) {
            if ( query.where.station_id === 1 ) {
              return countChargeEvents1.promise;
            } else {
              return countChargeEvents2.promise;
            }
          });
          spyOn( models.charge_event, 'findAll' ).andCallFake(function( query ) {
            if ( query.where.station_id === 1 ) {
              return findChargeEvents1.promise;
            } else {
              return findChargeEvents2.promise;
            }
          });
          chargeEvents1 = [];
          // seven days ago @ 12a to 1a for 1 hour
          chargeEvents1.push( { time_start: moment().subtract( 7, 'days' ).startOf( 'day' ).toDate(), time_stop: moment().subtract( 7, 'days' ).startOf( 'day' ).add( 1, 'hours' ).toDate(), kwh: 5, station_id: 1 } );
          // seven days ago @ 4a to 4:30a for 30 minutes
          chargeEvents1.push( { time_start: moment().subtract( 7, 'days' ).startOf( 'day' ).add( 4, 'hours' ).toDate(), time_stop: moment().subtract( 7, 'days' ).startOf( 'day' ).add( 4, 'hours' ).add( 30, 'minutes' ).toDate(), kwh: 2, station_id: 1 } );
          // five days ago @ 12:30a to 1a for 30 minutes
          chargeEvents1.push( { time_start: moment().subtract( 5, 'days' ).startOf( 'day' ).add( 30, 'minutes' ).toDate(), time_stop: moment().subtract( 5, 'days' ).startOf( 'day' ).add( 1, 'hours' ).toDate(), kwh: 3.5, station_id: 1 } );

          chargeEvents2 = [];
          // seven days ago @ 1a to 2:30a for 90 minutes
          chargeEvents2.push( { time_start: moment().subtract( 7, 'days' ).startOf( 'day' ).add( 1, 'hours' ).toDate(), time_stop: moment().subtract( 7, 'days' ).startOf( 'day' ).add( 2, 'hours' ).add( 30, 'minutes' ).toDate(), kwh: 4, station_id: 2 } );
        });

        it('should be a defined route (not 404)', function( done ) {
          findStations.reject( new Error( 'Test' ) );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( res.statusCode ).not.toBe( 404 );
          })
          .end( done );
        });

        it('should find all stations, ordered by cumulative_kwh', function( done ) {
          findStations.reject( new Error( 'Test' ) );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( models.station.findAll ).toHaveBeenCalled();
            expect( models.station.findAll ).toHaveBeenCalledWith( { where: { cumulative_kwh: { $ne: null } },  limit: 10, order: 'cumulative_kwh DESC' } );
          })
          .end( done );
        });

        it('should loop through all stations', function( done ) {
          findStations.resolve( [ station1, station2 ] );
          getStation1Plugs.reject( new Error( 'Test' ) );
          spyOn( async, 'each' ).andCallThrough();
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( async.each ).toHaveBeenCalled();
            expect( async.each.calls[ 0 ].args[ 0 ] ).toEqual( [ station1, station2 ] );
          })
          .end( done );
        });

        it('should get associated plugs for each station', function( done ) {
          findStations.resolve( [ station1, station2 ] );
          getStation1Plugs.resolve( [ plug1 ] );
          getStation2Plugs.reject( new Error( 'Test' ) );

          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( station1.getPlugs ).toHaveBeenCalled();
            expect( station1.getPlugs ).toHaveBeenCalledWith();
            expect( station2.getPlugs ).toHaveBeenCalled();
            expect( station2.getPlugs ).toHaveBeenCalledWith();
          })
          .end( done );
        });

        it('should count charge events for each station', function( done ) {
          findStations.resolve( [ station1, station2 ] );
          getStation1Plugs.resolve( [ plug1 ] );
          getStation2Plugs.resolve( [ plug2 ] );
          countChargeEvents1.resolve( 3 );
          countChargeEvents2.reject( new Error( 'Test' ) );

          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( models.charge_event.count.calls.length ).toBe( 2 );
            expect( models.charge_event.count.calls[ 0 ].args[ 0 ] ).toEqual( { where: { station_id: 1 } } );
            expect( models.charge_event.count.calls[ 1 ].args[ 0 ] ).toEqual( { where: { station_id: 2 } } );
          })
          .end( done );
        });

        it('should find all charge events for each station', function( done ) {
          findStations.resolve( [ station1, station2 ] );
          getStation1Plugs.resolve( [ plug1 ] );
          getStation2Plugs.resolve( [ plug2 ] );
          countChargeEvents1.resolve( 3 );
          countChargeEvents2.resolve( 1 );
          findChargeEvents1.resolve( chargeEvents1 );
          findChargeEvents2.reject( new Error( 'Test' ) );
          var sevenDaysAgo = moment().subtract( 7, 'days' ).startOf( 'day' );

          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( models.charge_event.findAll.calls.length ).toBe( 2 );
            expect( models.charge_event.findAll.calls[ 0 ].args[ 0 ] ).toEqual( { where: { station_id: 1, time_stop: { $ne: null }, time_start: { $gt: sevenDaysAgo.toDate() } }, order: 'time_start', raw: true } );
            expect( models.charge_event.findAll.calls[ 1 ].args[ 0 ] ).toEqual( { where: { station_id: 2, time_stop: { $ne: null }, time_start: { $gt: sevenDaysAgo.toDate() } }, order: 'time_start', raw: true } );
          })
          .end( done );
        });

        it('should return json after calculating graph data', function( done ) {
          findStations.resolve( [ station1, station2 ] );
          getStation1Plugs.resolve( [ plug1 ] );
          getStation2Plugs.resolve( [ plug2 ] );
          countChargeEvents1.resolve( 3 );
          countChargeEvents2.resolve( 1 );
          findChargeEvents1.resolve( chargeEvents1 );
          findChargeEvents2.resolve( chargeEvents2 );
          var sevenDaysAgo = moment().subtract( 7, 'days' ).startOf( 'day' );
          var expectedOutput = {
            stations: {
              0: station1.get( { plain: true } ),
              1: station2.get( { plain: true } )
            },
            plugs: {
              0: [ plug1 ],
              1: [ plug2 ]
            },
            events: {
              0: {
                count: 3,
                cumulative_kwh: 10.5,
                days: [ moment( chargeEvents1[ 0 ].time_start ).format( 'M[/]D'), moment( chargeEvents1[ 2 ].time_start ).format( 'M[/]D') ],
                plugIns: [ 2, 1 ],
                kwhGiven: [ 7, 3.5 ]
              },
              1: {
                count: 1,
                cumulative_kwh: 4,
                days: [ moment( chargeEvents2[ 0 ].time_start ).format( 'M[/]D') ],
                plugIns: [ 1 ],
                kwhGiven: [ 4 ]
              }
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
          findStations.reject( new Error( 'Test' ) );
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

    describe('station/network/cumulative', function() {
      var route = '/protected/station/network/cumulative';

      describe('GET', function() {
        var countEvents, sumKwh, findChargeEvents, chargeEvents;

        beforeEach(function() {
          countEvents = Q.defer();
          sumKwh = Q.defer();
          findChargeEvents = Q.defer();
          spyOn( models.charge_event, 'count' ).andReturn( countEvents.promise );
          spyOn( models.station, 'sum' ).andReturn( sumKwh.promise );
          spyOn( models.charge_event, 'findAll' ).andReturn( findChargeEvents.promise );
          chargeEvents = [];
          // seven days ago @ 12a to 1a for 1 hour
          chargeEvents.push( { time_start: moment().subtract( 7, 'days' ).startOf( 'day' ).toDate(), time_stop: moment().subtract( 7, 'days' ).startOf( 'day' ).add( 1, 'hours' ).toDate(), kwh: 5, station_id: 1 } );
          // seven days ago @ 4a to 4:30a for 30 minutes
          chargeEvents.push( { time_start: moment().subtract( 7, 'days' ).startOf( 'day' ).add( 4, 'hours' ).toDate(), time_stop: moment().subtract( 7, 'days' ).startOf( 'day' ).add( 4, 'hours' ).add( 30, 'minutes' ).toDate(), kwh: 2, station_id: 1 } );
          // five days ago @ 12:30a to 1a for 30 minutes
          chargeEvents.push( { time_start: moment().subtract( 5, 'days' ).startOf( 'day' ).add( 30, 'minutes' ).toDate(), time_stop: moment().subtract( 5, 'days' ).startOf( 'day' ).add( 1, 'hours' ).toDate(), kwh: 3.5, station_id: 1 } );
        });

        it('should be a defined route (not 404)', function( done ) {
          countEvents.reject( new Error( 'Test' ) );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( res.statusCode ).not.toBe( 404 );
          })
          .end( done );
        });

        it('should count charge events', function( done ) {
          countEvents.reject( new Error( 'Test' ) );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( models.charge_event.count ).toHaveBeenCalled();
            expect( models.charge_event.count ).toHaveBeenCalledWith();
          })
          .end( done );
        });

        it('should sum all stations\' cumulative_kwh', function( done ) {
          countEvents.resolve( 3 );
          sumKwh.reject( new Error( 'Test' ) );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( models.station.sum ).toHaveBeenCalled();
            expect( models.station.sum ).toHaveBeenCalledWith( 'cumulative_kwh' );
          })
          .end( done );
        });

        it('should find all events over last seven days which are not ongoing', function( done ) {
          countEvents.resolve( 3 );
          sumKwh.resolve( 10.5 );
          findChargeEvents.reject( new Error( 'Test' ) );
          var sevenDaysAgo = moment().subtract( 7, 'days' ).startOf( 'day' ).toDate();

          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( models.charge_event.findAll ).toHaveBeenCalled();
            expect( models.charge_event.findAll ).toHaveBeenCalledWith( { where: { time_stop: { $ne: null }, time_start: { $gt: sevenDaysAgo } }, order: 'time_start', raw: true } );
          })
          .end( done );
        });

        it('should return json after calculating graph data', function( done ) {
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
          countEvents.reject( new Error( 'Test' ) );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 500 )
          .expect( 'Content-Type', /text/ )
          .expect( 'Test' )
          .expect(function( res ) {
            expect( models.charge_event.count ).toHaveBeenCalled();
          })
          .end( done );
        });
      });
    });

    describe('station/network/:network', function() {
      var route = '/protected/station/network/Arizona';

      describe('GET', function() {
        var findStations;

        beforeEach(function() {
          findStations = Q.defer();
          spyOn( models.station, 'findAll' ).andReturn( findStations.promise );
        });

        it('should be a defined route (not 404)', function( done ) {
          findStations.reject( new Error( 'Test' ) );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( res.statusCode ).not.toBe( 404 );
          })
          .end( done );
        });

        it('should find all stations', function( done ) {
          findStations.reject( new Error( 'Test' ) );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( models.station.findAll ).toHaveBeenCalled();
            expect( models.station.findAll ).toHaveBeenCalledWith( { where: { network: 'Arizona' } } );
          })
          .end( done );
        });

        it('should resolve JSON of stations', function( done ) {
          findStations.resolve( [ { id: 1 }, { id: 2 } ] );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 200 )
          .expect( 'Content-Type', /json/ )
          .expect( [ { id: 1 }, { id: 2 } ] )
          .end( done );
        });

        it('should resolve 404 if no stations found', function( done ) {
          findStations.resolve( [] );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 404 )
          .expect( 'Content-Type', /text/ )
          .expect( 'That region was not found. Please try Arizona, Hawaii, Chicago, NoCal for Northern California, LA for Los Angeles, SD for San Diego, or SB for Santa Barbara Area.' )
          .end( done );
        });

        it('should return 500 failure for error', function( done ) {
          findStations.reject( new Error( 'Test' ) );
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