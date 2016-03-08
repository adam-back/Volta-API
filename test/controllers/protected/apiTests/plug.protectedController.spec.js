var models = require( '../../../../models');
var Q = require( 'q' );
var supertest = require( 'supertest' );
var app = require( '../../../../server.js' ).app;
supertest = supertest( app );

var createToken = require( '../../../jwtHelper' ).createToken;
var token = createToken( 5 );

module.exports = function() {
  ddescribe('PLUG ROUTES', function() {
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

      describe('POST', function() {
        var body, findStation, foundStation, findOrCreatePlug, foundPlug, associatePlug;

        beforeEach(function() {
          body = {
            kin: '001-0001-001-01-K',
            ekm_omnimeter_serial: 'A'
          };
          findStation = Q.defer();
          foundStation = models.station.build( { kin: '001-0001-001-01-K' } );
          findOrCreatePlug = Q.defer();
          foundPlug = { id: 1 };
          associatePlug = Q.defer();
          spyOn( models.station, 'findOne' ).andReturn( findStation.promise );
          spyOn( models.plug, 'findOrCreate' ).andReturn( findOrCreatePlug.promise );
          spyOn( foundStation, 'addPlug' ).andReturn( associatePlug.promise );
        });

        it('should be a defined route (not 404)', function( done ) {
          findStation.reject( new Error( 'Test' ) );
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect(function( res ) {
            expect( res.statusCode ).not.toBe( 404 );
          })
          .end( done );
        });

        it('should find one station by kin', function( done ) {
          findStation.reject( new Error( 'Test' ) );
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect(function( res ) {
            expect( models.station.findOne ).toHaveBeenCalled();
            expect( models.station.findOne ).toHaveBeenCalledWith( { where: { kin: '001-0001-001-01-K' } } );
          })
          .end( done );
        });

        it('should send 500 if no station found by kin', function( done ) {
          findStation.resolve( null );
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect( 500 )
          .expect( 'Content-Type', /text/ )
          .expect( 'No station found for kin 001-0001-001-01-K' )
          .expect(function( res ) {
            expect( models.plug.findOrCreate ).not.toHaveBeenCalled();
          })
          .end( done );
        });

        it('should find or create plug', function( done ) {
          findStation.resolve( foundStation );
          findOrCreatePlug.reject( new Error( 'Test' ) );
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect(function( res ) {
            expect( models.plug.findOrCreate ).toHaveBeenCalled();
            expect( models.plug.findOrCreate ).toHaveBeenCalledWith( { where: { ekm_omnimeter_serial: 'A' }, defaults: { ekm_omnimeter_serial: 'A' } } );
          })
          .end( done );
        });

        it('should associate plug if created', function( done ) {
          findStation.resolve( foundStation );
          findOrCreatePlug.resolve( [ foundPlug, true ] );
          associatePlug.reject( new Error( 'Test' ) );
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect(function( res ) {
            expect( foundStation.addPlug ).toHaveBeenCalled();
            expect( foundStation.addPlug ).toHaveBeenCalledWith( foundPlug );
          })
          .end( done );
        });

        it('should throw 409 if plug not created', function( done ) {
          findStation.resolve( foundStation );
          findOrCreatePlug.resolve( [ foundPlug, false ] );
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect( 409 )
          .expect( 'Content-Type', /json/ )
          .expect( foundPlug )
          .expect(function( res ) {
            expect( foundStation.addPlug ).not.toHaveBeenCalled();
          })
          .end( done );
        });

        it('should send success boolean on creation', function( done ) {
          findStation.resolve( foundStation );
          findOrCreatePlug.resolve( [ foundPlug, true ] );
          associatePlug.resolve();
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect( 200 )
          .expect( 'Content-Type', /json/ )
          .expect( { successfullyAddedPlug: true } )
          .end( done );
        });

        it('should return 500 failure for error', function( done ) {
          findStation.reject( new Error( 'Test' ) );
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect( 500 )
          .expect( 'Content-Type', /text/ )
          .expect( 'Test' )
          .expect(function( res ) {
            expect( models.station.findOne ).toHaveBeenCalled();
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