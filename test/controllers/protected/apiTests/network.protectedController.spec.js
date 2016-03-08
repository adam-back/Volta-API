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
  ddescribe('NETWORK ROUTES', function() {
    describe('station/network/top10', function() {
      var route = '/protected/station/network/top10';

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
        var countEvents;

        beforeEach(function() {
          countEvents = Q.defer();
          spyOn( models.charge_event, 'count' ).andReturn( countEvents.promise );
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