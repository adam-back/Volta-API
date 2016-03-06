var models = require( '../../../../models');
var Q = require( 'q' );
var supertest = require( 'supertest' );
var app = require( '../../../../server.js' ).app;
supertest = supertest( app );

var createToken = require( '../../../jwtHelper' ).createToken;
var token = createToken( 5 );

module.exports = function() {
  describe('PLUG ROUTES', function() {
    describe('plug/', function() {
      var route = '/protected/plug';

      describe('GET', function() {
        var plugFind;

        beforeEach(function() {
          plugFind = Q.defer();
          spyOn( models.plug, 'findAll' ).andReturn( plugFind.promise );
        });

        it('should be a defined route (not 404)', function( done ) {
          plugFind.reject( new Error( 'Test' ) );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( res.statusCode ).not.toBe( 404 );
          })
          .end( done );
        });

        it('should find all the plugs', function( done ) {
          plugFind.reject( new Error( 'Test' ) );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( models.plug.findAll ).toHaveBeenCalled();
            expect( models.plug.findAll ).toHaveBeenCalledWith( { raw: true } );
          })
          .end( done );
        });

        it('should return JSON of plugs ordered by station_id', function( done ) {
          plugFind.resolve( [ { id: 1, station_id: 1 }, { id: 3, station_id: 4 }, { id: 2, station_id: 1 } ] );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 200 )
          .expect( 'Content-Type', /json/ )
          .expect(function( res ) {
            expect( typeof res.body ).toBe( 'object' );
            expect( Array.isArray( res.body ) ).toBe( false );
            expect( res.body[ '1' ] ).toEqual( [ { id: 1, station_id: 1 }, { id: 2, station_id: 1 } ] );
            expect( res.body[ '2' ] ).not.toBeDefined();
            expect( res.body[ '3' ] ).not.toBeDefined();
            expect( res.body[ '4' ] ).toEqual( [ { id: 3, station_id: 4 } ] );
          })
          .end( done );
        });

        it('should return 500 failure for error', function( done ) {
          plugFind.reject( new Error( 'Test' ) );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 500 )
          .expect( 'Content-Type', /text/ )
          .expect( 'Test' )
          .expect(function( res ) {
            expect( models.plug.findAll ).toHaveBeenCalled();
          })
          .end( done );
        });
      });
    });

    describe('plug/:id', function() {
      var route = '/protected/plug/42';

      describe('GET', function() {
        var plugFind;

        beforeEach(function() {
          plugFind = Q.defer();
          spyOn( models.plug, 'findOne' ).andReturn( plugFind.promise );
        });

        it('should be a defined route (not 404)', function( done ) {
          plugFind.reject( new Error( 'Test' ) );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( res.statusCode ).not.toBe( 404 );
          })
          .end( done );
        });

        it('should find plug by id', function( done ) {
          plugFind.reject( new Error( 'Test' ) );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( models.plug.findOne ).toHaveBeenCalled();
            expect( models.plug.findOne ).toHaveBeenCalledWith( { where: { id: 42 }, raw: true } );
          })
          .end( done );
        });

        it('should return JSON of found plug', function( done ) {
          plugFind.resolve( { id: 1, station_id: 1 } );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 200 )
          .expect( 'Content-Type', /json/ )
          .expect(function( res ) {
            expect( typeof res.body ).toBe( 'object' );
            expect( Array.isArray( res.body ) ).toBe( false );
            expect( res.body ).toEqual( { id: 1, station_id: 1 } );
          })
          .end( done );
        });

        it('should return 404 if no plug found', function( done ) {
          plugFind.resolve( null );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 404 )
          .expect( 'Content-Type', /text/ )
          .expect( 'Plug with that id not found in database.' )
          .end( done );
        });

        it('should return 500 failure for error', function( done ) {
          plugFind.reject( new Error( 'Test' ) );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 500 )
          .expect( 'Content-Type', /text/ )
          .expect( 'Test' )
          .expect(function( res ) {
            expect( models.plug.findOne ).toHaveBeenCalled();
          })
          .end( done );
        });
      });
    });
  });
};