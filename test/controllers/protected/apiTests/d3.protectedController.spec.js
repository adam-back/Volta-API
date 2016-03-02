var supertest = require( 'supertest' );
var app = require( '../../../../server.js' ).app;
supertest = supertest( app );
var createToken = require( '../../../jwtHelper' ).createToken;
var token = createToken( 5 );

var moment = require( 'moment' );
moment().format();
var db = require( '../../../../models' );
var Q = require( 'q' );
var reportHelpers = require( '../../../../factories/reportHelpers' );
var growth = require( '../../../../factories/reports/kwhGrowthOverTime.js' );
var time = require( '../../../../factories/reports/eventsOverTime.js' );
var controller = require( '../../../../controllers/protected/d3.protectedController.js' );

module.exports = function() {
  describe('D3 ROUTES', function() {
    afterEach(function() {
      controller.memoizedData = {
        kinNetworks: {
          data: null,
          lastFetch: null
        },
        kwhGrowth: {
          data: null,
          lastFetch: null
        },
        thirtyDays: {
          data: null,
          lastFetch: null
        },
        sunburst: {
          data: null,
          lastFetch: null
        }
      };
    });

    describe('D3/networkSunburst', function() {
      var route = '/protected/D3/networkSunburst';

      describe('GET', function() {
      });
    });

    describe('D3/kinNetwork', function() {
      var route = '/protected/D3/kinNetwork';

      describe('GET', function() {
        var formatKin;

        beforeEach(function() {
          formatKin = Q.defer();
          spyOn( reportHelpers, 'formatKinsWithNetworks' ).andReturn( formatKin.promise );
        });

        it('should be a defined route (not 404)', function( done ) {
          formatKin.reject();
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( res.statusCode ).not.toBe( 404 );
          })
          .end( done );
        });

        it('should check if data has been memoized or old', function( done ) {
          controller.memoizedData.kinNetworks.data = true;
          spyOn( controller, 'isOld' ).andReturn( false );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( reportHelpers.formatKinsWithNetworks ).not.toHaveBeenCalled();
            expect( controller.isOld ).toHaveBeenCalled();
            expect( controller.isOld ).toHaveBeenCalledWith( 'kinNetworks' );
          })
          .end( done );
        });

        it('should return memoized data if data if not old', function( done ) {
          controller.memoizedData.kinNetworks.data = true;
          spyOn( controller, 'isOld' ).andReturn( false );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 200 )
          .expect( 'true' )
          .end( done );
        });

        it('should call formatKinsWithNetworks', function( done ) {
          formatKin.reject();
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( reportHelpers.formatKinsWithNetworks ).toHaveBeenCalled();
            expect( reportHelpers.formatKinsWithNetworks ).toHaveBeenCalledWith();
          })
          .end( done );
        });

        it('should memoize and return data', function( done ) {
          formatKin.resolve( 'csv,stuff' );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 200 )
          .expect( 'csv,stuff' )
          .expect(function( res ) {
            expect( controller.memoizedData.kinNetworks.data ).toBe( 'csv,stuff' );
            expect( moment.isMoment( controller.memoizedData.kinNetworks.lastFetch ) ).toBe( true );
            expect( controller.memoizedData.kinNetworks.lastFetch.fromNow() ).toBe( 'a few seconds ago' );
          })
          .end( done );
        });

        it('should catch and send errors', function( done ) {
          formatKin.reject( 'error' );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 500 )
          .expect( 'error' )
          .end( done );
        });
      });
    });

    describe('D3/kinGrowth', function() {
      var route = '/protected/D3/kinGrowth';

      describe('GET', function() {
        var kwhGrowth;

        beforeEach(function() {
          kwhGrowth = Q.defer();
          spyOn( growth, 'kwhGrowthOverTime' ).andReturn( kwhGrowth.promise );
        });

        it('should be a defined route (not 404)', function( done ) {
          kwhGrowth.reject();
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( res.statusCode ).not.toBe( 404 );
          })
          .end( done );
        });

        it('should check if data has been memoized or old', function( done ) {
          controller.memoizedData.kwhGrowth.data = true;
          spyOn( controller, 'isOld' ).andReturn( false );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( growth.kwhGrowthOverTime ).not.toHaveBeenCalled();
            expect( controller.isOld ).toHaveBeenCalled();
            expect( controller.isOld ).toHaveBeenCalledWith( 'kwhGrowth' );
          })
          .end( done );
        });

        it('should return memoized data if data if not old', function( done ) {
          controller.memoizedData.kwhGrowth.data = true;
          spyOn( controller, 'isOld' ).andReturn( false );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 200 )
          .expect( 'true' )
          .end( done );
        });

        it('should call kwhGrowthOverTime', function( done ) {
          kwhGrowth.reject();
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( growth.kwhGrowthOverTime ).toHaveBeenCalled();
            expect( growth.kwhGrowthOverTime ).toHaveBeenCalledWith();
          })
          .end( done );
        });

        it('should memoize and return data', function( done ) {
          kwhGrowth.resolve( 'csv,stuff' );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 200 )
          .expect( 'csv,stuff' )
          .expect(function( res ) {
            expect( controller.memoizedData.kwhGrowth.data ).toBe( 'csv,stuff' );
            expect( moment.isMoment( controller.memoizedData.kwhGrowth.lastFetch ) ).toBe( true );
            expect( controller.memoizedData.kwhGrowth.lastFetch.fromNow() ).toBe( 'a few seconds ago' );
          })
          .end( done );
        });

        it('should catch and send errors', function( done ) {
          kwhGrowth.reject( 'error' );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 500 )
          .expect( 'error' )
          .end( done );
        });
      });
    });

    describe('D3/30Days', function() {
      var route = '/protected/D3/30Days';

      describe('GET', function() {
        var get30Days;

        beforeEach(function() {
          get30Days = Q.defer();
          spyOn( time, 'dataOverThirtyDays' ).andReturn( get30Days.promise );
        });

        it('should be a defined route (not 404)', function( done ) {
          get30Days.reject();
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( res.statusCode ).not.toBe( 404 );
          })
          .end( done );
        });

        it('should check if data has been memoized or old', function( done ) {
          controller.memoizedData.thirtyDays.data = true;
          spyOn( controller, 'isOld' ).andReturn( false );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( time.dataOverThirtyDays ).not.toHaveBeenCalled();
            expect( controller.isOld ).toHaveBeenCalled();
            expect( controller.isOld ).toHaveBeenCalledWith( 'thirtyDays' );
          })
          .end( done );
        });

        it('should return memoized data if data if not old', function( done ) {
          controller.memoizedData.thirtyDays.data = true;
          spyOn( controller, 'isOld' ).andReturn( false );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 200 )
          .expect( 'true' )
          .end( done );
        });

        it('should call dataOverThirtyDays', function( done ) {
          get30Days.reject();
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( time.dataOverThirtyDays ).toHaveBeenCalled();
            expect( time.dataOverThirtyDays ).toHaveBeenCalledWith();
          })
          .end( done );
        });

        it('should memoize and return data', function( done ) {
          get30Days.resolve( 'csv,stuff' );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 200 )
          .expect( 'csv,stuff' )
          .expect(function( res ) {
            expect( controller.memoizedData.thirtyDays.data ).toBe( 'csv,stuff' );
            expect( moment.isMoment( controller.memoizedData.thirtyDays.lastFetch ) ).toBe( true );
            expect( controller.memoizedData.thirtyDays.lastFetch.fromNow() ).toBe( 'a few seconds ago' );
          })
          .end( done );
        });

        it('should catch and send errors', function( done ) {
          get30Days.reject( 'error' );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 500 )
          .expect( 'error' )
          .end( done );
        });
      });
    });
  });
};