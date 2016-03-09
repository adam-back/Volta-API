var models = require( '../../../../models');
var Q = require( 'q' );
var ekm = require('../../../../factories/ekmFactory.js');
// var geocoder = require( 'node-geocoder' )( 'google', 'https', { apiKey: config.googleApiKey, formatter: null } );
var greatCircleDistance = require( '../../../../factories/distanceFactory.js' ).getDistanceFromLatLonInMiles;
var csv = require( '../../../../factories/csvFactory' );
var helper = require( '../../../../factories/reportHelpers' );
var moment = require( 'moment' );
moment().format();

var supertest = require( 'supertest' );
var app = require( '../../../../server.js' ).app;
supertest = supertest( app );
var createToken = require( '../../../jwtHelper' ).createToken;
var token = createToken( 5 );

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
        ddescribe('GET', function() {
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

      xdescribe('reports/withoutCoordinates/:output', function() {
        var route = '/protected/reports/withoutCoordinates/:output';

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

      xdescribe('reports/wrongCoordinates/:output', function() {
        var route = '/protected/reports/wrongCoordinates/:output';

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