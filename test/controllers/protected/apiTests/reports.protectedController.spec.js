var models = require( '../../../../models');
var Q = require( 'q' );
var async = require( 'async' );
var ekm = require('../../../../factories/ekmFactory.js');
var distance = require( '../../../../factories/distanceFactory.js' );
var csv = require( '../../../../factories/csvFactory' );
var helper = require( '../../../../factories/reportHelpers' );
var moment = require( 'moment' );
moment().format();

var supertest = require( 'supertest' );
var app = require( '../../../../server.js' ).app;
supertest = supertest( app );
var createToken = require( '../../../jwtHelper' ).createToken;
var token = createToken();
var controller = require( '../../../../controllers/protected/reports.protectedController.js' );

module.exports = function() {
  describe('REPORT ROUTES', function() {
    describe('reports/dashboard', function() {
      var route = '/protected/reports/dashboard';

      describe('GET', function() {
        var plugs, stations, chargeEvents;
        var findAllPlugs, findAllStations, countAllChargeEvents, getBrokenPlugs, getLastTenChargeEvents;

        beforeEach(function() {
          plugs = [ { id: 1, meter_status: 'error', ekm_omnimeter_serial: 'A', in_use: null }, { id: 2, meter_status: 'charging', ekm_omnimeter_serial: 'B', in_use: true }  ];
          stations = [ { id: 1, kin: '001-0001-001-01-K', in_use: null, location_gps: null, cumulative_kwh: 2.5, location: 'Main', location_address: '123 Main' }, { id: 2, kin: '001-0001-001-02-K', in_use: true, location_gps: [ 1, 2 ], cumulative_kwh: 1.5, location: 'Volta', location_address: '123 Volta' } ];
          chargeEvents = [ { id: 1, station_id: 1, plug_id: 1 }, { id: 2, station_id: 2, plug_id: 2 }, { id: 3, station_id: 1, plug_id: 1 } ];
          findAllPlugs = Q.defer();
          findAllStations = Q.defer();
          countAllChargeEvents = Q.defer();
          getBrokenPlugs = Q.defer();
          getLastTenChargeEvents = Q.defer();
          spyOn( models.plug, 'findAll' ).andReturn( findAllPlugs.promise );
          spyOn( models.station, 'findAll' ).andReturn( findAllStations.promise );
          spyOn( models.charge_event, 'count' ).andReturn( countAllChargeEvents.promise );
          spyOn( helper, 'getBrokenPlugs' ).andReturn( getBrokenPlugs.promise );
          spyOn( models.charge_event, 'findAll' ).andReturn( getLastTenChargeEvents.promise );
        });

        it('should be a defined route (not 404)', function( done ) {
          findAllPlugs.reject( new Error( 'Test' ) );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( res.statusCode ).not.toBe( 404 );
          })
          .end( done );
        });

        it('should find all plugs', function( done ) {
          findAllPlugs.reject( new Error( 'Test' ) );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( models.plug.findAll ).toHaveBeenCalled();
            expect( models.plug.findAll ).toHaveBeenCalledWith( { raw: true } );
          })
          .end( done );
        });

        it('should find all stations', function( done ) {
          findAllPlugs.resolve( plugs );
          findAllStations.reject( new Error( 'Test' ) );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( models.plug.findAll ).toHaveBeenCalled();
            expect( models.plug.findAll ).toHaveBeenCalledWith( { raw: true } );
          })
          .end( done );
        });

        it('should count the total number of charge events', function( done ) {
          findAllPlugs.resolve( plugs );
          findAllStations.resolve( stations );
          countAllChargeEvents.reject( new Error( 'Test' ) );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( models.charge_event.count ).toHaveBeenCalled();
            expect( models.charge_event.count ).toHaveBeenCalledWith();
          })
          .end( done );
        });

        it('should get broken plugs', function( done ) {
          findAllPlugs.resolve( plugs );
          findAllStations.resolve( stations );
          countAllChargeEvents.resolve( 15 );
          getBrokenPlugs.reject( new Error( 'Test' ) );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( helper.getBrokenPlugs ).toHaveBeenCalled();
            expect( helper.getBrokenPlugs ).toHaveBeenCalledWith();
          })
          .end( done );
        });

        it('should get last ten charge events', function( done ) {
          findAllPlugs.resolve( plugs );
          findAllStations.resolve( stations );
          countAllChargeEvents.resolve( 15 );
          getBrokenPlugs.resolve( [ 'broken stuff' ] );
          getLastTenChargeEvents.reject( new Error( 'Test' ) );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( models.charge_event.findAll ).toHaveBeenCalled();
            expect( models.charge_event.findAll ).toHaveBeenCalledWith( { order: 'id DESC', limit: 10, attributes: [ 'time_start', 'id', 'station_id', 'plug_id' ], raw: true } );
          })
          .end( done );
        });

        it('should return 200 with an object of dashboard data', function( done ) {
          var expectedData = {
            broken: {
              labels: [ 'Error', 'OK' ],
              data: [ 1, 1 ]
            },
            currentUsage: {
              labels: [ 'In Use', 'Available' ],
              data: [ 1, 1 ]
            },
            needMeter: {
              labels: [ 'Needs Meter', 'Metered' ],
              data: [ 1, 1 ]
            },
            needGPS: {
              labels: [ 'Needs Coordinates', 'Has Coordinates' ],
              data: [ 1, 1 ]
            },
            cumulative: {
              numberOfStations: 2,
              total: 4,
              calcs: {
                offset: 6.1 ,
                gallons: 0.3,
                trees: 0.1,
                miles: 14,
                events: 15
              }
            },
            recentCharges: chargeEvents,
            brokenStations: [ 'broken stuff' ]
          };
          findAllPlugs.resolve( plugs );
          findAllStations.resolve( stations );
          countAllChargeEvents.resolve( 15 );
          getBrokenPlugs.resolve( [ 'broken stuff' ] );
          getLastTenChargeEvents.resolve( chargeEvents );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 200 )
          .expect( 'Content-Type', /json/ )
          .expect(function( res ) {
            expect( res.body ).toEqual( expectedData );
          })
          .end( done );
        });

        it('should return 500 failure for error', function( done ) {
          findAllPlugs.reject( new Error( 'Test' ) );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 500 )
          .expect( 'Test' )
          .expect( 'Content-Type', /text/ )
          .expect(function( res ) {
            expect( models.plug.findAll ).toHaveBeenCalled();
          })
          .end( done );
        });
      });
    });

    describe('OPS', function() {
      describe('reports/broken/:output', function() {
        describe('GET', function() {
          var route;
          var getBrokenPlugs, generateCSV;

          beforeEach(function() {
            route = '/protected/reports/broken/';
            getBrokenPlugs = Q.defer();
            generateCSV = Q.defer();
            spyOn( helper, 'getBrokenPlugs' ).andReturn( getBrokenPlugs.promise );
            spyOn( csv, 'generateCSV' ).andReturn( generateCSV.promise );
          });

          it('should be a defined route (not 404)', function( done ) {
            route += 'Web';
            getBrokenPlugs.reject( new Error( 'Test' ) );
            supertest.get( route )
            .set( 'Authorization', 'Bearer ' + token )
            .expect(function( res ) {
              expect( res.statusCode ).not.toBe( 404 );
            })
            .end( done );
          });

          it('should call reportHelper to getBrokenPlugs', function( done ) {
            route += 'CSV';
            getBrokenPlugs.reject( new Error( 'Test' ) );
            supertest.get( route )
            .set( 'Authorization', 'Bearer ' + token )
            .expect(function( res ) {
              expect( helper.getBrokenPlugs ).toHaveBeenCalled();
              expect( helper.getBrokenPlugs ).toHaveBeenCalledWith();
            })
            .end( done );
          });

          it('Web: should sort plugs by kin', function( done ) {
            route += 'Web';
            getBrokenPlugs.resolve( [ { kin: '001-0002-001-01-K' }, { kin: '001-0001-001-01-K' }, { kin: '001-0001-001-02-K' } ] );
            supertest.get( route )
            .set( 'Authorization', 'Bearer ' + token )
            .expect( 'Content-Type', /json/ )
            .expect( [ { kin: '001-0001-001-01-K' }, { kin: '001-0001-001-02-K' }, { kin: '001-0002-001-01-K' } ] )
            .expect(function( res ) {
              expect( csv.generateCSV ).not.toHaveBeenCalled();
            })
            .end( done );
          });

          it('CSV: should generate CSV', function( done ) {
            var fields = [ 'kin', 'location', 'location_address', 'network', 'ekm_omnimeter_serial', 'ekm_push_mac', 'number_on_station', 'ekm_url' ];
            var fieldNames = [ 'KIN', 'Location', 'Address', 'Network', 'Omnimeter S/N', 'Push MAC', 'Plug #', 'EKM Url' ];
            route += 'CSV';
            getBrokenPlugs.resolve( [ { kin: '001-0002-001-01-K' }, { kin: '001-0001-001-01-K' }, { kin: '001-0001-001-02-K' } ] );
            generateCSV.reject( new Error( 'Test' ) );
            supertest.get( route )
            .set( 'Authorization', 'Bearer ' + token )
            .expect(function( res ) {
              expect( csv.generateCSV ).toHaveBeenCalled();
              expect( csv.generateCSV ).toHaveBeenCalledWith( [ { kin: '001-0002-001-01-K' }, { kin: '001-0001-001-01-K' }, { kin: '001-0001-001-02-K' } ], fields, fieldNames );
            })
            .end( done );
          });

          it('should throw error for unsupported output', function( done ) {
            route += 'Other';
            getBrokenPlugs.resolve( [ { kin: '001-0002-001-01-K' }, { kin: '001-0001-001-01-K' }, { kin: '001-0001-001-02-K' } ] );
            supertest.get( route )
            .set( 'Authorization', 'Bearer ' + token )
            .expect( 500 )
            .expect( 'Content-Type', /text/ )
            .expect( 'Output not supported: Other' )
            .expect(function( res ) {
              expect( csv.generateCSV ).not.toHaveBeenCalled();
            })
            .end( done );
          });

          it('should resolve data', function( done ) {
            route += 'Web';
            getBrokenPlugs.resolve( [ { kin: '001-0002-001-01-K' }, { kin: '001-0001-001-01-K' }, { kin: '001-0001-001-02-K' } ] );
            supertest.get( route )
            .set( 'Authorization', 'Bearer ' + token )
            .expect( 'Content-Type', /json/ )
            .expect( [ { kin: '001-0001-001-01-K' }, { kin: '001-0001-001-02-K' }, { kin: '001-0002-001-01-K' } ] )
            .expect(function( res ) {
              expect( csv.generateCSV ).not.toHaveBeenCalled();
            })
            .end( done );
          });

          it('should return 500 failure for error', function( done ) {
            route += 'Web';
            getBrokenPlugs.reject( new Error( 'Test' ) );
            supertest.get( route )
            .set( 'Authorization', 'Bearer ' + token )
            .expect( 500 )
            .expect( 'Test' )
            .expect( 'Content-Type', /text/ )
            .expect(function( res ) {
              expect( helper.getBrokenPlugs ).toHaveBeenCalled();
              expect( helper.getBrokenPlugs ).toHaveBeenCalledWith();
            })
            .end( done );
          });
        });
      });

      xdescribe('reports/one/:kin', function() {
        var route = '/protected/reports/one/:kin';

        describe('GET', function() {
          var getAll;

          beforeEach(function() {
            getAll = Q.defer();
            spyOn( media_slide, 'findAll' ).andReturn( getAll.promise );
          });

          it('should be a defined route (not 404)', function( done ) {
            getAll.reject();
            supertest.get( route )
            .set( 'Authorization', 'Bearer ' + token )
            .expect(function( res ) {
              expect( res.statusCode ).not.toBe( 404 );
            })
            .end( done );
          });

          it('should return 500 failure for error', function( done ) {
            getAll.reject( 'Test' );
            supertest.get( route )
            .set( 'Authorization', 'Bearer ' + token )
            .expect( 500 )
            .expect( 'Test' )
            .expect( 'Content-Type', /text/ )
            .expect(function( res ) {
              expect( media_slide.findAll ).toHaveBeenCalled();
              expect( media_slide.findAll ).toHaveBeenCalledWith();
            })
            .end( done );
          });
        });
      });

      describe('reports/withoutCoordinates/:output', function() {
        describe('GET', function() {
          var route;
          var findStations, generateCSV;

          beforeEach(function() {
            route = '/protected/reports/withoutCoordinates/';
            findStations = Q.defer();
            generateCSV = Q.defer();
            spyOn( models.station, 'findAll' ).andReturn( findStations.promise );
            spyOn( csv, 'generateCSV' ).andReturn( generateCSV.promise );
          });

          it('should be a defined route (not 404)', function( done ) {
            route += 'Web';
            findStations.reject( new Error( 'Test' ) );
            supertest.get( route )
            .set( 'Authorization', 'Bearer ' + token )
            .expect(function( res ) {
              expect( res.statusCode ).not.toBe( 404 );
            })
            .end( done );
          });

          it('should find stations without GPS and order by kin', function( done ) {
            route += 'CSV';
            findStations.reject( new Error( 'Test' ) );
            supertest.get( route )
            .set( 'Authorization', 'Bearer ' + token )
            .expect(function( res ) {
              expect( models.station.findAll ).toHaveBeenCalled();
              expect( models.station.findAll ).toHaveBeenCalledWith( { where: { location_gps: null }, order: 'kin ASC' } );
            })
            .end( done );
          });

          it('Web: send stations', function( done ) {
            route += 'Web';
            findStations.resolve( [ true ] );
            supertest.get( route )
            .set( 'Authorization', 'Bearer ' + token )
            .expect( 200 )
            .expect( 'Content-Type', /json/ )
            .expect( [ true ] )
            .expect(function( res ) {
              expect( csv.generateCSV ).not.toHaveBeenCalled();
            })
            .end( done );
          });

          it('CSV: should generate CSV and resolve data', function( done ) {
            var fields = [ 'kin', 'location', 'location_address', 'network' ];
            var fieldNames = [ 'KIN', 'Location', 'Address', 'Network' ];
            route += 'CSV';
            findStations.resolve( [ true ] );
            generateCSV.resolve( 'Test' );

            supertest.get( route )
            .set( 'Authorization', 'Bearer ' + token )
            .expect( 200 )
            .expect( 'Content-Type', /text/ )
            .expect( 'Test' )
            .expect(function( res ) {
              expect( csv.generateCSV ).toHaveBeenCalled();
              expect( csv.generateCSV ).toHaveBeenCalledWith( [ true ], fields, fieldNames );
            })
            .end( done );
          });

          it('should throw error for unsupported output', function( done ) {
            route += 'Other';
            findStations.resolve( [ true ] );
            supertest.get( route )
            .set( 'Authorization', 'Bearer ' + token )
            .expect( 500 )
            .expect( 'Content-Type', /text/ )
            .expect( 'Output not supported: Other' )
            .expect(function( res ) {
              expect( csv.generateCSV ).not.toHaveBeenCalled();
            })
            .end( done );
          });

          it('should return 500 failure for error', function( done ) {
            route += 'Web';
            findStations.reject( new Error( 'Test' ) );
            supertest.get( route )
            .set( 'Authorization', 'Bearer ' + token )
            .expect( 500 )
            .expect( 'Test' )
            .expect( 'Content-Type', /text/ )
            .expect(function( res ) {
              expect( models.station.findAll ).toHaveBeenCalled();
            })
            .end( done );
          });
        });
      });

      describe('reports/withoutMeters/:output', function() {
        var route;

        describe('GET', function() {
          var findAllPlugs, findAllStations, generateCSV;

          beforeEach(function() {
            route = '/protected/reports/withoutMeters/';
            findAllPlugs = Q.defer();
            findAllStations = Q.defer();
            generateCSV = Q.defer();
            spyOn( models.plug, 'findAll' ).andReturn( findAllPlugs.promise );
            spyOn( models.station, 'findAll' ).andReturn( findAllStations.promise );
            spyOn( csv, 'generateCSV' ).andReturn( generateCSV.promise );
          });

          it('should be a defined route (not 404)', function( done ) {
            route += 'Web';
            findAllPlugs.reject( new Error( 'Test' ) );
            supertest.get( route )
            .set( 'Authorization', 'Bearer ' + token )
            .expect(function( res ) {
              expect( res.statusCode ).not.toBe( 404 );
            })
            .end( done );
          });

          it('should find all plugs\' station_ids', function( done ) {
            route += 'Web';
            findAllPlugs.reject( new Error( 'Test' ) );
            supertest.get( route )
            .set( 'Authorization', 'Bearer ' + token )
            .expect(function( res ) {
              expect( models.plug.findAll ).toHaveBeenCalled();
              expect( models.plug.findAll ).toHaveBeenCalledWith( { attributes: [ 'station_id' ], raw: true } );
            })
            .end( done );
          });

          it('should find all stations without attached plugs', function( done ) {
            route += 'Web';
            findAllPlugs.resolve( [ { station_id: 1 }, { station_id: 2 } ] );
            findAllStations.reject( new Error( 'Test' ) );
            supertest.get( route )
            .set( 'Authorization', 'Bearer ' + token )
            .expect(function( res ) {
              expect( models.station.findAll ).toHaveBeenCalled();
              expect( models.station.findAll ).toHaveBeenCalledWith( { where: { id: { $notIn: [ 1, 2 ] } }, raw: true, order: [ 'kin' ] } );
            })
            .end( done );
          });

          it('should generate CSV', function( done ) {
            route += 'CSV';
            var fields = [ 'kin', 'location', 'location_address', 'network' ];
            var fieldNames = [ 'KIN', 'Location', 'Address', 'Network' ];
            findAllPlugs.resolve( [ { station_id: 1 }, { station_id: 2 } ] );
            findAllStations.resolve( [ 'true' ] );
            generateCSV.reject( new Error( 'Test' ) );

            supertest.get( route )
            .set( 'Authorization', 'Bearer ' + token )
            .expect(function( res ) {
              expect( csv.generateCSV ).toHaveBeenCalled();
              expect( csv.generateCSV ).toHaveBeenCalledWith( [ 'true' ], fields, fieldNames );
            })
            .end( done );
          });

          it('should resolve data', function( done ) {
            route += 'Web';
            findAllPlugs.resolve( [ { station_id: 1 }, { station_id: 2 } ] );
            findAllStations.resolve( [ 'true' ] );

            supertest.get( route )
            .set( 'Authorization', 'Bearer ' + token )
            .expect( 200 )
            .expect( 'Content-Type', /json/ )
            .expect( [ 'true' ] )
            .expect(function( res ) {
              expect( csv.generateCSV ).not.toHaveBeenCalled();
            })
            .end( done );
          });

          it('should return 500 failure for error', function( done ) {
            route += 'Web';
            findAllPlugs.reject( new Error( 'Test' ) );
            supertest.get( route )
            .set( 'Authorization', 'Bearer ' + token )
            .expect( 500 )
            .expect( 'Test' )
            .expect( 'Content-Type', /text/ )
            .expect(function( res ) {
              expect( models.plug.findAll ).toHaveBeenCalled();
            })
            .end( done );
          });
        });
      });

      describe('reports/wallmounts/:output', function() {
        var route;

        describe('GET', function() {
          var findAllStations, generateCSV;

          beforeEach(function() {
            route = '/protected/reports/wallmounts/';
            findAllStations = Q.defer();
            generateCSV = Q.defer();
            spyOn( models.station, 'findAll' ).andReturn( findAllStations.promise );
            spyOn( csv, 'generateCSV' ).andReturn( generateCSV.promise );
          });

          it('should be a defined route (not 404)', function( done ) {
            route += 'Web';
            findAllStations.reject( new Error( 'Test' ) );
            supertest.get( route )
            .set( 'Authorization', 'Bearer ' + token )
            .expect(function( res ) {
              expect( res.statusCode ).not.toBe( 404 );
            })
            .end( done );
          });

          it('should find all stations', function( done ) {
            route += 'Web';
            findAllStations.reject( new Error( 'Test' ) );
            supertest.get( route )
            .set( 'Authorization', 'Bearer ' + token )
            .expect(function( res ) {
              expect( models.station.findAll ).toHaveBeenCalled();
              expect( models.station.findAll ).toHaveBeenCalledWith( { where: { kin: { $like: '%-W' } }, raw: true, order: [ 'kin' ] } );
            })
            .end( done );
          });

          it('should generate CSV', function( done ) {
            var fields = [ 'kin', 'location', 'location_address', 'network' ];
            var fieldNames = [ 'KIN', 'Location', 'Address', 'Network' ];
            route += 'CSV';
            findAllStations.resolve( [ 'true' ] );
            generateCSV.reject( new Error( 'Test' ) );

            supertest.get( route )
            .set( 'Authorization', 'Bearer ' + token )
            .expect(function( res ) {
              expect( csv.generateCSV ).toHaveBeenCalled();
              expect( csv.generateCSV ).toHaveBeenCalledWith( [ 'true' ], fields, fieldNames );
            })
            .end( done );
          });

          it('should resolve data', function( done ) {
            route += 'Web';
            findAllStations.resolve( [ 'true' ] );

            supertest.get( route )
            .set( 'Authorization', 'Bearer ' + token )
            .expect( 200 )
            .expect( 'Content-Type', /json/ )
            .expect( [ 'true' ] )
            .expect(function( res ) {
              expect( csv.generateCSV ).not.toHaveBeenCalled();
            })
            .end( done );
          });

          it('should return 500 failure for error', function( done ) {
            route += 'Web';
            findAllStations.reject( new Error( 'Test' ) );
            supertest.get( route )
            .set( 'Authorization', 'Bearer ' + token )
            .expect( 500 )
            .expect( 'Test' )
            .expect( 'Content-Type', /text/ )
            .expect(function( res ) {
              expect( models.station.findAll ).toHaveBeenCalled();
            })
            .end( done );
          });
        });
      });

      describe('reports/wrongCoordinates/:output', function() {
        describe('GET', function() {
          var route;
          var findAll, station1, station2, station3, geocode1, geocode2, generateCSV;

          beforeEach(function() {
            route = '/protected/reports/wrongCoordinates/';
            findAll = Q.defer();
            station1 = { kin: '001-0001-001-01-K', location_address: '123 Main', location_gps: [ 1, 2 ] };
            station2 = { kin: '001-0001-002-01-K', location_address: '123 Broad', location_gps: [ 3, 4 ] };
            station3 = { kin: '001-0001-001-02-K', location_address: '123 Main', location_gps: [ 1, 2 ] };
            geocode1 = Q.defer();
            geocode2 = Q.defer();
            generateCSV = Q.defer();
            spyOn( models.station, 'findAll' ).andReturn( findAll.promise );
            spyOn( controller, 'geocodeLater' ).andCallFake(function( time, location ) {
              if ( time === 1000 ) {
                return geocode1.promise;
              } else {
                return geocode2.promise;
              }
            });
            spyOn( csv, 'generateCSV' ).andReturn( generateCSV.promise );
          });

          it('should be a defined route (not 404)', function( done ) {
            route += 'Web';
            findAll.reject( new Error( 'Test' ) );
            supertest.get( route )
            .set( 'Authorization', 'Bearer ' + token )
            .expect(function( res ) {
              expect( res.statusCode ).not.toBe( 404 );
            })
            .end( done );
          });

          it('should findAll stations with coordinates', function( done ) {
            route += 'Web';
            findAll.reject( new Error( 'Test' ) );
            supertest.get( route )
            .set( 'Authorization', 'Bearer ' + token )
            .expect(function( res ) {
              expect( models.station.findAll ).toHaveBeenCalled();
              expect( models.station.findAll ).toHaveBeenCalledWith( { where: { location_gps: { $ne: null } }, attributes: [ 'kin', 'location', 'location_address', 'location_gps', 'network' ], raw: true } );
            })
            .end( done );
          });

          it('should loop over all stations', function( done ) {
            spyOn( async, 'each' ).andCallThrough();
            route += 'Web';
            findAll.resolve( [ station1, station2, station3 ] );
            geocode1.reject( new Error( 'Test' ) );

            supertest.get( route )
            .set( 'Authorization', 'Bearer ' + token )
            .expect(function( res ) {
              expect( async.each ).toHaveBeenCalled();
              expect( async.each.calls[ 0 ].args[ 0 ] ).toEqual( [ station1, station2, station3 ] );
            })
            .end( done );
          });

          it('should only geocode addresses necessary', function( done ) {
            route += 'Web';
            findAll.resolve( [ station1, station2, station3 ] );
            geocode1.resolve( [ { latitude: 1, longitude: 2 } ] );
            geocode2.reject( new Error( 'Test' ) );

            supertest.get( route )
            .set( 'Authorization', 'Bearer ' + token )
            .expect(function( res ) {
              expect( controller.geocodeLater.callCount ).toBe( 2 );
              expect( controller.geocodeLater.calls[ 0 ].args ).toEqual( [ 1000, '123 Main' ] );
              expect( controller.geocodeLater.calls[ 1 ].args ).toEqual( [ 2000, '123 Broad' ] );
            })
            .end( done );
          });

          it('should get distances between GPS and geocoded addresses', function( done ) {
            route += 'Web';
            findAll.resolve( [ station1, station2, station3 ] );
            geocode1.resolve( [ { latitude: 1, longitude: 2 } ] );
            geocode2.resolve( [ { latitude: 3, longitude: 4 } ] );
            spyOn( distance, 'getDistanceFromLatLonInMiles' ).andReturn( 0 );

            supertest.get( route )
            .set( 'Authorization', 'Bearer ' + token )
            .expect(function( res ) {
              expect( distance.getDistanceFromLatLonInMiles.callCount ).toBe( 3 );
              expect( distance.getDistanceFromLatLonInMiles.calls[ 0 ].args ).toEqual( [ [ 1, 2 ], station1.location_gps ] );
              expect( distance.getDistanceFromLatLonInMiles.calls[ 1 ].args ).toEqual( [ [ 3, 4 ], station2.location_gps ] );
              expect( distance.getDistanceFromLatLonInMiles.calls[ 2 ].args ).toEqual( [ [ 1, 2 ], station3.location_gps ] );
            })
            .end( done );
          });

          it('should flag distances greater than 1 mile', function( done ) {
            route += 'Web';
            findAll.resolve( [ station1, station2, station3 ] );
            geocode1.resolve( [ { latitude: 1, longitude: 2 } ] );
            geocode2.resolve( [ { latitude: 3, longitude: 4 } ] );
            spyOn( distance, 'getDistanceFromLatLonInMiles' ).andReturn( 1.1 );

            supertest.get( route )
            .set( 'Authorization', 'Bearer ' + token )
            .expect(function( res ) {
              expect( res.body.length ).toEqual( 3 );
            })
            .end( done );
          });

          it('should add distance to the flagged station', function( done ) {
            route += 'Web';
            findAll.resolve( [ station1, station2, station3 ] );
            geocode1.resolve( [ { latitude: 1, longitude: 2 } ] );
            geocode2.resolve( [ { latitude: 3, longitude: 4 } ] );
            spyOn( distance, 'getDistanceFromLatLonInMiles' ).andReturn( 1.1 );

            supertest.get( route )
            .set( 'Authorization', 'Bearer ' + token )
            .expect(function( res ) {
              expect( res.body[ 0 ].hasOwnProperty( 'distance' ) ).toBe( true );
              expect( res.body[ 1 ].hasOwnProperty( 'distance' ) ).toBe( true );
              expect( res.body[ 2 ].hasOwnProperty( 'distance' ) ).toBe( true );
              expect( res.body[ 0 ].distance ).toBe( 1.1 );
              expect( res.body[ 1 ].distance ).toBe( 1.1 );
              expect( res.body[ 2 ].distance ).toBe( 1.1 );
            })
            .end( done );
          });

          it('should stringify flagged stations\' gps coordinates', function( done ) {
            route += 'Web';
            findAll.resolve( [ station1, station2, station3 ] );
            geocode1.resolve( [ { latitude: 1, longitude: 2 } ] );
            geocode2.resolve( [ { latitude: 3, longitude: 4 } ] );
            spyOn( distance, 'getDistanceFromLatLonInMiles' ).andReturn( 1.1 );

            supertest.get( route )
            .set( 'Authorization', 'Bearer ' + token )
            .expect(function( res ) {
              expect( typeof res.body[ 0 ].location_gps ).toBe( 'string' );
              expect( typeof res.body[ 1 ].location_gps ).toBe( 'string' );
              expect( typeof res.body[ 2 ].location_gps ).toBe( 'string' );
              expect( res.body[ 0 ].location_gps ).toBe( '1,2' );
              expect( res.body[ 1 ].location_gps ).toBe( '3,4' );
              expect( res.body[ 2 ].location_gps ).toBe( '1,2' );
            })
            .end( done );
          });

          it('Web: send stations', function( done ) {
            route += 'Web';
            findAll.resolve( [ station1, station2, station3 ] );
            geocode1.resolve( [ { latitude: 1, longitude: 2 } ] );
            geocode2.resolve( [ { latitude: 3, longitude: 4 } ] );
            spyOn( distance, 'getDistanceFromLatLonInMiles' ).andReturn( 1.1 );

            supertest.get( route )
            .set( 'Authorization', 'Bearer ' + token )
            .expect( 200 )
            .expect( 'Content-Type', /json/ )
            .expect( [ station1, station2, station3 ] )
            .end( done );
          });

          it('CSV: generate and send', function( done ) {
            var fields = [ 'kin', 'location', 'network', 'location_address', 'location_gps', 'distance' ];
            var fieldNames = [ 'KIN', 'Location', 'Network', 'Address', 'GPS Coordinates', 'Difference (mi.)' ];
            route += 'CSV';
            findAll.resolve( [ station1, station2, station3 ] );
            geocode1.resolve( [ { latitude: 1, longitude: 2 } ] );
            geocode2.resolve( [ { latitude: 3, longitude: 4 } ] );
            spyOn( distance, 'getDistanceFromLatLonInMiles' ).andReturn( 1.1 );
            generateCSV.resolve( 'Done' );
            supertest.get( route )
            .set( 'Authorization', 'Bearer ' + token )
            .expect( 200 )
            .expect( 'Content-Type', /text/ )
            .expect(function( res ) {
              expect( csv.generateCSV ).toHaveBeenCalled();
              expect( csv.generateCSV ).toHaveBeenCalledWith( [ station1, station2, station3 ], fields, fieldNames );
            })
            .expect( 'Done' )
            .end( done );
          });

          it('should catch an error thrown by generateCSV', function( done ) {
            var fields = [ 'kin', 'location', 'network', 'location_address', 'location_gps', 'distance' ];
            var fieldNames = [ 'KIN', 'Location', 'Network', 'Address', 'GPS Coordinates', 'Difference (mi.)' ];
            route += 'CSV';
            findAll.resolve( [ station1, station2, station3 ] );
            geocode1.resolve( [ { latitude: 1, longitude: 2 } ] );
            geocode2.resolve( [ { latitude: 3, longitude: 4 } ] );
            spyOn( distance, 'getDistanceFromLatLonInMiles' ).andReturn( 1.1 );
            generateCSV.reject( new Error( 'Test' ) );

            supertest.get( route )
            .set( 'Authorization', 'Bearer ' + token )
            .expect( 500 )
            .expect( 'Content-Type', /text/ )
            .expect(function( res ) {
              expect( csv.generateCSV ).toHaveBeenCalled();
            })
            .expect( 'Test' )
            .end( done );
          });

          it('should throw error for unsupported output', function( done ) {
            route += 'Other';
            findAll.resolve( [ station1, station2, station3 ] );
            geocode1.resolve( [ { latitude: 1, longitude: 2 } ] );
            geocode2.resolve( [ { latitude: 3, longitude: 4 } ] );
            spyOn( distance, 'getDistanceFromLatLonInMiles' ).andReturn( 1.1 );

            supertest.get( route )
            .set( 'Authorization', 'Bearer ' + token )
            .expect( 404 )
            .expect( 'Content-Type', /text/ )
            .expect(function( res ) {
              expect( csv.generateCSV ).not.toHaveBeenCalled();
            })
            .expect( 'Output not supported: Other' )
            .end( done );
          });

          it('should return 500 failure for error', function( done ) {
            route += 'Web';
            findAll.reject( new Error( 'Test' ) );
            supertest.get( route )
            .set( 'Authorization', 'Bearer ' + token )
            .expect( 500 )
            .expect( 'Test' )
            .expect( 'Content-Type', /text/ )
            .expect(function( res ) {
              expect( models.station.findAll ).toHaveBeenCalled();
            })
            .end( done );
          });
        });
      });

      describe('reports/downloadStations/CSV', function() {
        var route = '/protected/reports/downloadStations/CSV';

        describe('GET', function() {
          var findAllStations, generateCSV;

          beforeEach(function() {
            findAllStations = Q.defer();
            generateCSV = Q.defer();
            spyOn( models.station, 'findAll' ).andReturn( findAllStations.promise );
            spyOn( csv, 'generateCSV' ).andReturn( generateCSV.promise );
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

          it('should 404 for Web endpoint', function( done ) {
            route = '/protected/reports/downloadStations/Web';
            findAllStations.reject( new Error( 'Test' ) );
            supertest.get( route )
            .set( 'Authorization', 'Bearer ' + token )
            .expect( 404 )
            .expect(function( res ) {
              route = '/protected/reports/downloadStations/CSV';
            })
            .end( done );
          });

          it('should generate CSV after manipulating data', function( done ) {
            var fields = [ 'kin', 'location', 'location_address', 'location_gps', 'network', 'install_date', 'ekm_push_mac', 'sim_card', 'cumulative_kwh' ];
            var fieldNames = [ 'KIN', 'Location', 'Address', 'GPS', 'Network', 'Install Date', 'Push MAC', 'SIM card', 'Meter Reading (kWh)' ];
            var stations = [ { location_gps: [ 1, 2 ], location: null }, { location_gps: null, location: 'Home' } ];
            findAllStations.resolve( stations );
            generateCSV.reject( new Error( 'Test' ) );

            supertest.get( route )
            .set( 'Authorization', 'Bearer ' + token )
            .expect(function( res ) {
              expect( csv.generateCSV ).toHaveBeenCalled();
              expect( csv.generateCSV ).toHaveBeenCalledWith( stations, fields, fieldNames );
            })
            .end( done );
          });

          it('should send CSV', function( done ) {
            var stations = [ { location_gps: [ 1, 2 ], location: null }, { location_gps: null, location: 'Home' } ];
            findAllStations.resolve( stations );
            generateCSV.resolve( 'CSV' );

            supertest.get( route )
            .set( 'Authorization', 'Bearer ' + token )
            .expect( 200 )
            .expect( 'Content-Type', /text/ )
            .expect( 'CSV' )
            .end( done );
          });

          it('should return 500 failure for error', function( done ) {
            findAllStations.reject( new Error( 'Test' ) );
            supertest.get( route )
            .set( 'Authorization', 'Bearer ' + token )
            .expect( 500 )
            .expect( 'Test' )
            .expect( 'Content-Type', /text/ )
            .expect(function( res ) {
              expect( models.station.findAll ).toHaveBeenCalled();
            })
            .end( done );
          });
        });
      });
    });

    describe('MEDIA SALES', function() {
      describe('reports/chargeEventsOverTime/CSV', function() {
        var route;

        describe('GET', function() {
          var getChargeEventsOverTime, generateCSV;

          beforeEach(function() {
            route = '/protected/reports/chargeEventsOverTime/CSV';
            getChargeEventsOverTime = Q.defer();
            generateCSV = Q.defer();
            spyOn( helper, 'chargeEventsOverTime' ).andReturn( getChargeEventsOverTime.promise );
            spyOn( csv, 'generateCSV' ).andReturn( generateCSV.promise );
          });

          it('should be a defined route (not 404)', function( done ) {
            getChargeEventsOverTime.reject( new Error( 'Test' ) );
            supertest.get( route )
            .set( 'Authorization', 'Bearer ' + token )
            .expect(function( res ) {
              expect( res.statusCode ).not.toBe( 404 );
            })
            .end( done );
          });

          it('should 404 for Web endpoint', function( done ) {
            route = route.slice( 0, -3 );
            route += 'Web';

            supertest.get( route )
            .set( 'Authorization', 'Bearer ' + token )
            .expect( 404 )
            .end( done );
          });

          it('should get charge events by 30 minute interval', function( done ) {
            getChargeEventsOverTime.reject( new Error( 'Test' ) );
            supertest.get( route )
            .set( 'Authorization', 'Bearer ' + token )
            .expect(function( res ) {
              expect( helper.chargeEventsOverTime ).toHaveBeenCalled();
              expect( helper.chargeEventsOverTime ).toHaveBeenCalledWith( null, [ 30, 'minutes' ] );
            })
            .end( done );
          });

          it('should generate CSV data', function( done ) {
            getChargeEventsOverTime.resolve( [ 'true' ] );
            generateCSV.reject( new Error( 'Test' ) );
            var fields = [ 'time', 'events', 'kwh' ];
            var fieldNames = [ 'End Of Period', 'Number of Sessions', 'Cumulative kWh' ];

            supertest.get( route )
            .set( 'Authorization', 'Bearer ' + token )
            .expect(function( res ) {
              expect( csv.generateCSV ).toHaveBeenCalled();
              expect( csv.generateCSV ).toHaveBeenCalledWith( [ 'true' ], fields, fieldNames );
            })
            .end( done );
          });

          it('should send data', function( done ) {
            getChargeEventsOverTime.resolve( [ 'true' ] );
            generateCSV.resolve( 'Data' );

            supertest.get( route )
            .set( 'Authorization', 'Bearer ' + token )
            .expect( 200 )
            .expect( 'Content-Type', /text/ )
            .expect( 'Data' )
            .end( done );
          });

          it('should return 500 failure for error', function( done ) {
            getChargeEventsOverTime.reject( new Error( 'Test' ) );
            supertest.get( route )
            .set( 'Authorization', 'Bearer ' + token )
            .expect( 500 )
            .expect( 'Test' )
            .expect( 'Content-Type', /text/ )
            .expect(function( res ) {
              expect( helper.chargeEventsOverTime ).toHaveBeenCalled();
            })
            .end( done );
          });
        });
      });

      describe('reports/getLastThirtyDays/CSV', function() {
        var route;

        describe('GET', function() {
          var getAllStations, getChargesOverLastThirtyDaysForOneStation, generateCSV;

          beforeEach(function() {
            route = '/protected/reports/getLastThirtyDays/CSV';
            getAllStations = Q.defer();
            getChargesOverLastThirtyDaysForOneStation = Q.defer();
            generateCSV = Q.defer();
            spyOn( models.station, 'findAll' ).andReturn( getAllStations.promise );
            spyOn( helper, 'chargesOverLastThirtyDaysForOneStation' ).andReturn( getChargesOverLastThirtyDaysForOneStation.promise );
            spyOn( csv, 'generateCSV' ).andReturn( generateCSV.promise );
          });

          it('should be a defined route (not 404)', function( done ) {
            getAllStations.reject( new Error( 'Test' ) );
            supertest.get( route )
            .set( 'Authorization', 'Bearer ' + token )
            .expect(function( res ) {
              expect( res.statusCode ).not.toBe( 404 );
            })
            .end( done );
          });

          it('should 404 for Web endpoint', function( done ) {
            route = route.slice( 0, -3 );
            route += 'Web';

            supertest.get( route )
            .set( 'Authorization', 'Bearer ' + token )
            .expect( 404 )
            .end( done );
          });

          it('should find all stations', function( done ) {
            getAllStations.reject( new Error( 'Test' ) );
            supertest.get( route )
            .set( 'Authorization', 'Bearer ' + token )
            .expect(function( res ) {
              expect( models.station.findAll ).toHaveBeenCalled();
              expect( models.station.findAll ).toHaveBeenCalledWith( { raw: true } );
            })
            .end( done );
          });

          it('should map over stations, applying chargesOverLastThirtyDaysForOneStation to each', function( done ) {
            getAllStations.resolve( [ 1, 2, 3 ] );
            getChargesOverLastThirtyDaysForOneStation.reject( new Error( 'Test' ) );
            spyOn( Q, 'all' ).andCallThrough();

            supertest.get( route )
            .set( 'Authorization', 'Bearer ' + token )
            .expect(function( res ) {
              expect( helper.chargesOverLastThirtyDaysForOneStation.callCount ).toBe( 3 );
              expect( helper.chargesOverLastThirtyDaysForOneStation.calls[ 0 ].args[ 0 ] ).toBe( 1 );
              expect( helper.chargesOverLastThirtyDaysForOneStation.calls[ 1 ].args[ 0 ] ).toBe( 2 );
              expect( helper.chargesOverLastThirtyDaysForOneStation.calls[ 2 ].args[ 0 ] ).toBe( 3 );
              expect( Q.all ).toHaveBeenCalled();
            })
            .end( done );
          });

          it('should order everything by kin', function( done ) {
            getAllStations.resolve( [ 1, 2, 3 ] );
            getChargesOverLastThirtyDaysForOneStation.resolve( true );
            generateCSV.reject( new Error( 'Test' ) );
            spyOn( helper, 'orderByKin' );

            supertest.get( route )
            .set( 'Authorization', 'Bearer ' + token )
            .expect(function( res ) {
              expect( helper.orderByKin ).toHaveBeenCalled();
              expect( helper.orderByKin ).toHaveBeenCalledWith( [ true, true, true ] );
            })
            .end( done );
          });

          it('should generateCSV', function( done ) {
            var fields = [
              'kin',
              'location',
              'since',
              // cumulative kWh
              'kWh',
              'carbon',
              'miles',
              'trees',
              'gallons',
              // charge events
              'numberOfCharges',
              'averageChargeEventsPerDay',
              'medianChargeEventsPerDay',
              'averageDurationOfEvent',
              'medianDurationOfEvent',
              // Average kwh per event
              'averageKwhOfEvent',
              'averageCarbonPerEvent',
              'averageMilesPerEvent',
              'averageTreesPerEvent',
              'averageGallonsPerEvent',
              // Median kwh per event
              'medianKwhOfEvent',
              'medianCarbonPerEvent',
              'medianMilesPerEvent',
              'medianTreesPerEvent',
              'medianGallonsPerEvent'
            ];
            var fieldNames = [
              'KIN',
              'Location',
              'Start of 30 Days',
              // cumulative kWh
              '30 Day kWh',
              '30 Day Carbon Offset (lbs)',
              '30 Day Miles',
              '30 Day Trees',
              '30 Day Gallons',
              // charge events
              'Total Charges Events',
              'Average Charge Events/Day',
              'Median Charge Events/Day',
              'Average Duration Of Event',
              'Median Duration Of Event',
              // Average kwh per event
              'Average kWh Per Event',
              'Average Carbon Offset Per Event',
              'Average Miles Per Event',
              'Average Trees Per Event',
              'Average Gallons Per Event',
              // Median kwh per event
              'Median kWh Of Event',
              'Median Carbon Offset Per Event',
              'Median Miles Per Event',
              'Median Trees Per Event',
              'Median Gallons Per Event'
            ];
            getAllStations.resolve( [ 1, 2, 3 ] );
            getChargesOverLastThirtyDaysForOneStation.resolve( true );
            generateCSV.reject( new Error( 'Test' ) );
            spyOn( helper, 'orderByKin' ).andReturn( 'ordered by kin' );

            supertest.get( route )
            .set( 'Authorization', 'Bearer ' + token )
            .expect(function( res ) {
              expect( csv.generateCSV ).toHaveBeenCalled();
              expect( csv.generateCSV ).toHaveBeenCalledWith( 'ordered by kin', fields, fieldNames );
            })
            .end( done );
          });

          it('should generateCSV', function( done ) {
            var fields = [
              'kin',
              'location',
              'since',
              // cumulative kWh
              'kWh',
              'carbon',
              'miles',
              'trees',
              'gallons',
              // charge events
              'numberOfCharges',
              'averageChargeEventsPerDay',
              'medianChargeEventsPerDay',
              'averageDurationOfEvent',
              'medianDurationOfEvent',
              // Average kwh per event
              'averageKwhOfEvent',
              'averageCarbonPerEvent',
              'averageMilesPerEvent',
              'averageTreesPerEvent',
              'averageGallonsPerEvent',
              // Median kwh per event
              'medianKwhOfEvent',
              'medianCarbonPerEvent',
              'medianMilesPerEvent',
              'medianTreesPerEvent',
              'medianGallonsPerEvent'
            ];
            var fieldNames = [
              'KIN',
              'Location',
              'Start of 30 Days',
              // cumulative kWh
              '30 Day kWh',
              '30 Day Carbon Offset (lbs)',
              '30 Day Miles',
              '30 Day Trees',
              '30 Day Gallons',
              // charge events
              'Total Charges Events',
              'Average Charge Events/Day',
              'Median Charge Events/Day',
              'Average Duration Of Event',
              'Median Duration Of Event',
              // Average kwh per event
              'Average kWh Per Event',
              'Average Carbon Offset Per Event',
              'Average Miles Per Event',
              'Average Trees Per Event',
              'Average Gallons Per Event',
              // Median kwh per event
              'Median kWh Of Event',
              'Median Carbon Offset Per Event',
              'Median Miles Per Event',
              'Median Trees Per Event',
              'Median Gallons Per Event'
            ];
            getAllStations.resolve( [ 1, 2, 3 ] );
            getChargesOverLastThirtyDaysForOneStation.resolve( true );
            generateCSV.reject( new Error( 'Test' ) );
            spyOn( helper, 'orderByKin' ).andReturn( 'ordered by kin' );

            supertest.get( route )
            .set( 'Authorization', 'Bearer ' + token )
            .expect(function( res ) {
              expect( csv.generateCSV ).toHaveBeenCalled();
              expect( csv.generateCSV ).toHaveBeenCalledWith( 'ordered by kin', fields, fieldNames );
            })
            .end( done );
          });

          it('should send data', function( done ) {
            getAllStations.resolve( [ 1, 2, 3 ] );
            getChargesOverLastThirtyDaysForOneStation.resolve( true );
            generateCSV.resolve( 'Data' );
            spyOn( helper, 'orderByKin' );

            supertest.get( route )
            .set( 'Authorization', 'Bearer ' + token )
            .expect( 200 )
            .expect( 'Content-Type', /text/ )
            .expect( 'Data' )
            .end( done );
          });

          it('should return 500 failure for error', function( done ) {
            getAllStations.reject( new Error( 'Test' ) );
            supertest.get( route )
            .set( 'Authorization', 'Bearer ' + token )
            .expect( 500 )
            .expect( 'Test' )
            .expect( 'Content-Type', /text/ )
            .expect(function( res ) {
              expect( models.station.findAll ).toHaveBeenCalled();
            })
            .end( done );
          });
        });
      });
    });

  });
};