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
var token = createToken( 5 );
var controller = require( '../../../../controllers/protected/reports.protectedController.js' );

module.exports = function() {
  describe('REPORT ROUTES', function() {
    xdescribe('reports/dashboard', function() {
      var route = '/protected/reports/dashboard';

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

      xdescribe('reports/withoutMeters/:output', function() {
        var route = '/protected/reports/withoutMeters/:output';

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

      xdescribe('reports/wallmounts/:output', function() {
        var route = '/protected/reports/wallmounts/:output';

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

      xdescribe('reports/downloadStations/CSV', function() {
        var route = '/protected/reports/downloadStations/CSV';

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
    });

    describe('MEDIA SALES', function() {
      xdescribe('reports/chargeEventsOverTime/CSV', function() {
        var route = '/protected/reports/chargeEventsOverTime/CSV';

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

      xdescribe('reports/getLastThrirtyDays/CSV', function() {
        var route = '/protected/reports/getLastThrirtyDays/CSV';

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
    });

  });
};