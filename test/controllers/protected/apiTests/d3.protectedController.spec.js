var supertest = require( 'supertest' );
var app = require( '../../../../server.js' ).app;
supertest = supertest( app );
var createToken = require( '../../../jwtHelper' ).createToken;
var token = createToken();

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
        sunburst: {
          data: null,
          lastFetch: null
        }
      };
    });

    describe('D3/networkSunburst', function() {
      var route = '/protected/D3/networkSunburst';

      describe('GET', function() {
        var findStations;

        beforeEach(function() {
          findStations = Q.defer();
          spyOn( db.station, 'findAll' ).andReturn( findStations.promise );
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

        it('should check if data has been memoized or old', function( done ) {
          controller.memoizedData.sunburst.data = true;
          spyOn( controller, 'isOld' ).andReturn( false );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( db.station.findAll ).not.toHaveBeenCalled();
            expect( controller.isOld ).toHaveBeenCalled();
            expect( controller.isOld ).toHaveBeenCalledWith( 'sunburst' );
          })
          .end( done );
        });

        it('should return memoized data if data is not old', function( done ) {
          controller.memoizedData.sunburst.data = true;
          spyOn( controller, 'isOld' ).andReturn( false );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 200 )
          .expect( 'true' )
          .end( done );
        });

        it('should find all stations', function( done ) {
          findStations.reject( new Error( 'Test' ) );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( db.station.findAll ).toHaveBeenCalled();
            expect( db.station.findAll ).toHaveBeenCalledWith( { where: { cumulative_kwh: { $ne: null } }, attributes: [ 'kin', 'cumulative_kwh', 'location_address', 'location', 'network' ], raw: true } );
          })
          .end( done );
        });

        it('should return an object', function( done ) {
          findStations.resolve();
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( typeof res ).toBe( 'object' );
            expect( Array.isArray( res ) ).toBe( false );
          })
          .end( done );
        });

        it('should create a tree of unique station data', function( done ) {
          var stations = [
            {
              location_address: '123 Main St., San Francisco, CA 94121',
              network: 'NoCal',
              location: 'Home',
              kin: '1',
              cumulative_kwh: 2
            },
            {
              location_address: '123 Main St., San Francisco, CA 94121',
              network: 'NoCal',
              location: 'Home',
              kin: '2',
              cumulative_kwh: 8
            },
            {
              location_address: '1 Michigan Ave., Chicago, IL 22222',
              network: 'Chicago',
              location: 'Downdown Chitown',
              kin: '4',
              cumulative_kwh: 2.3
            }
          ]
          findStations.resolve( stations );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            // zero level
            expect( res.body.hasOwnProperty( 'name' ) ).toBe( true );
            expect( res.body[ 'name' ] ).toBe( 'Meter kWh' );
            expect( res.body.hasOwnProperty( 'parent' ) ).toBe( true );
            expect( res.body.parent ).toBe( null );
            expect( res.body.hasOwnProperty( 'children' ) ).toBe( true );
            expect( Array.isArray( res.body.children ) ).toBe( true );
            expect( res.body.children.length ).toBe( 2 );
            // first level: networks
            var networks = res.body.children;
            expect( networks[ 0 ].name ).toBe( 'NoCal' );
            expect( networks[ 0 ].parent ).toBe( 'Meter kWh' );
            expect( networks[ 0 ].hasOwnProperty( 'children' ) ).toBe( true );
            expect( networks[ 0 ].children.length ).toBe( 1 );
            // second level: cities
            var cities = networks[ 0 ].children;
            expect( cities[ 0 ].name ).toBe( 'San Francisco' );
            expect( cities[ 0 ].parent ).toBe( 'NoCal' );
            expect( cities[ 0 ].hasOwnProperty( 'children' ) ).toBe( true );
            expect( cities[ 0 ].children.length ).toBe( 1 );
            // third level: locations
            var locations = cities[ 0 ].children;
            expect( locations[ 0 ].name ).toBe( 'Home' );
            expect( locations[ 0 ].parent ).toBe( 'San Francisco' );
            expect( locations[ 0 ].hasOwnProperty( 'children' ) ).toBe( true );
            expect( locations[ 0 ].children.length ).toBe( 2 );
            // third level: stations
            var stations = locations[ 0 ].children;
            expect( stations[ 0 ].name ).toBe( '1' );
            expect( stations[ 0 ].parent ).toBe( 'Home' );
            expect( stations[ 0 ].hasOwnProperty( 'children' ) ).toBe( false );
            expect( stations[ 0 ].hasOwnProperty( 'size' ) ).toBe( true );
            expect( stations[ 0 ].size ).toBe( 2 );
          })
          .end( done );
        });

        it('should convert Chicago network into Chicagoland', function( done ) {
          var stations = [
            {
              location_address: '1 Michigan Ave., Chicago, IL 22222',
              network: 'Chicago',
              location: 'Downdown Chitown',
              kin: '4',
              cumulative_kwh: 2.3
            }
          ];
          findStations.resolve( stations );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            // zero level
            expect( res.body.hasOwnProperty( 'name' ) ).toBe( true );
            expect( res.body[ 'name' ] ).toBe( 'Meter kWh' );
            expect( res.body.hasOwnProperty( 'parent' ) ).toBe( true );
            expect( res.body.parent ).toBe( null );
            expect( res.body.hasOwnProperty( 'children' ) ).toBe( true );
            expect( Array.isArray( res.body.children ) ).toBe( true );
            expect( res.body.children.length ).toBe( 1 );
            // first level: networks
            var networks = res.body.children;
            expect( networks[ 0 ].name ).toBe( 'Chicagoland' );
            expect( networks[ 0 ].parent ).toBe( 'Meter kWh' );
            expect( networks[ 0 ].hasOwnProperty( 'children' ) ).toBe( true );
            expect( networks[ 0 ].children.length ).toBe( 1 );
            // second level: cities
            var cities = networks[ 0 ].children;
            expect( cities[ 0 ].name ).toBe( 'Chicago' );
            expect( cities[ 0 ].parent ).toBe( 'Chicagoland' );
            expect( cities[ 0 ].hasOwnProperty( 'children' ) ).toBe( true );
            expect( cities[ 0 ].children.length ).toBe( 1 );
          })
          .end( done );
        });

        it('should catch and send errors', function( done ) {
          findStations.reject( new Error( 'Test' ) );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 500 )
          .expect( 'Content-Type', /text/ )
          .expect( 'Test' )
          .end( done );
        });
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
          formatKin.reject( new Error( 'Test' ) );
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

        it('should return memoized data if data is not old', function( done ) {
          controller.memoizedData.kinNetworks.data = true;
          spyOn( controller, 'isOld' ).andReturn( false );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 200 )
          .expect( 'true' )
          .end( done );
        });

        it('should call formatKinsWithNetworks', function( done ) {
          formatKin.reject( new Error( 'Test' ) );
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
          formatKin.reject( new Error( 'Test' ) );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 500 )
          .expect( 'Content-Type', /text/ )
          .expect( 'Test' )
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
          kwhGrowth.reject( new Error( 'Test' ) );
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

        it('should return memoized data if data is not old', function( done ) {
          controller.memoizedData.kwhGrowth.data = true;
          spyOn( controller, 'isOld' ).andReturn( false );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 200 )
          .expect( 'true' )
          .end( done );
        });

        it('should call kwhGrowthOverTime', function( done ) {
          kwhGrowth.reject( new Error( 'Test' ) );
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
          kwhGrowth.reject( new Error( 'Test' ) );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 500 )
          .expect( 'Content-Type', /text/ )
          .expect( 'Test' )
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
          get30Days.reject( new Error( 'Test' ) );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( res.statusCode ).not.toBe( 404 );
          })
          .end( done );
        });

        it('should call dataOverThirtyDays', function( done ) {
          get30Days.resolve( 'Stuff' );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 200 )
          .expect(function( res ) {
            expect( time.dataOverThirtyDays ).toHaveBeenCalled();
            expect( time.dataOverThirtyDays ).toHaveBeenCalledWith();
          })
          .expect( 'Stuff' )
          .end( done );
        });

        it('should catch and send errors', function( done ) {
          get30Days.reject( new Error( 'Test' ) );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 500 )
          .expect( 'Content-Type', /text/ )
          .expect( 'Test' )
          .end( done );
        });
      });
    });
  });
};
