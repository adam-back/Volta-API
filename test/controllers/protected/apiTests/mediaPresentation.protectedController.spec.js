var request = require( 'request' );
var models = require( '../../../../models' );
var async = require( 'async' );
var supertest = require( 'supertest' );
var app = require( '../../../../server.js' ).app;
supertest = supertest( app );
var Q = require( 'q' );
var createToken = require( '../../../jwtHelper' ).createToken;
var controller = require( '../../../../controllers/protected/mediaPresentation.protectedController.js' );
var token = createToken( 5 );

module.exports = function() {
  describe('PRESENTATIONS', function() {
    describe('mediaPresentation/', function() {
      var route = '/protected/mediaPresentation';

      describe('GET', function() {
        var getPresentations;

        beforeEach(function() {
          getPresentations = Q.defer();
          spyOn( controller, 'getMediaPresentations' ).andReturn( getPresentations.promise );
        });

        it('should be a defined route (not 404)', function( done ) {
          getPresentations.reject();
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( res.statusCode ).not.toBe( 404 );
          })
          .end( done );
        });

        it('should get all media presentations', function( done ) {
          getPresentations.reject();
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( controller.getMediaPresentations ).toHaveBeenCalled();
            expect( controller.getMediaPresentations ).toHaveBeenCalledWith( null, 'id' );
          })
          .end( done );
        });

        it('should resolve 200 formatted presentations', function( done ) {
          getPresentations.resolve( { key: true } );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 200 )
          .expect( 'Content-Type', /json/ )
          .expect( { key: true } )
          .end( done );
        });

        it('should return 500 failure for error', function( done ) {
          getPresentations.reject( 'Test' );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 500 )
          .expect( 'Test' )
          .expect(function( res ) {
            expect( controller.getMediaPresentations ).toHaveBeenCalled();
          })
          .end( done );
        });
      });

      describe('POST', function() {
        var createPresentation, newPresentation, addSlides, body;

        beforeEach(function() {
          createPresentation = Q.defer();
          addSlides = Q.defer();
          newPresentation = models.media_presentation.build( { id: 1, name: 'Dog', active: false, slide_order: [ '1', '2' ] } );
          spyOn( models.media_presentation, 'findOrCreate' ).andReturn( createPresentation.promise );
          spyOn( newPresentation, 'addMediaSlides' ).andReturn( addSlides.promise );
          body = {
            name: 'Dog',
            slideOrder: [ '1', '2' ],
            mediaSlides: [ { id: 3 }, { id: 4 } ]
          };
        });

        it('should be a defined route (not 404)', function( done ) {
          createPresentation.reject();
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect(function( res ) {
            expect( res.statusCode ).not.toBe( 404 );
          })
          .end( done );
        });

        it('should find or create presentation', function( done ) {
          createPresentation.reject();
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect(function( res ) {
            expect( models.media_presentation.findOrCreate ).toHaveBeenCalled();
            expect( models.media_presentation.findOrCreate ).toHaveBeenCalledWith( { where: { name: 'Dog' }, defaults: { name: 'Dog', active: false, slide_order: [ '1', '2' ] } } );
          })
          .end( done );
        });

        it('should add media slides if presentation was created', function( done ) {
          createPresentation.resolve( [ newPresentation, true ] );
          addSlides.reject();
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect(function( res ) {
            expect( newPresentation.addMediaSlides ).toHaveBeenCalled();
            expect( newPresentation.addMediaSlides ).toHaveBeenCalledWith( [ 3, 4 ] );
          })
          .end( done );
        });

        it('should resolve 200 true if creation successful', function( done ) {
          createPresentation.resolve( [ newPresentation, true ] );
          addSlides.resolve();
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect( 200 )
          .expect( 'Content-Type', /json/ )
          .expect( { successfullyAddedmediaPresentation: true } )
          .end( done );
        });

        it('should resolve 200 false if presentation was found', function( done ) {
          createPresentation.resolve( [ newPresentation, false ] );
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect( 200 )
          .expect( 'Content-Type', /json/ )
          .expect( { successfullyAddedmediaPresentation: false } )
          .expect(function( res ) {
            expect( newPresentation.addMediaSlides ).not.toHaveBeenCalled();
          })
          .end( done );
        });

        it('should return 500 failure for error', function( done ) {
          createPresentation.reject( 'Test' );
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect( 500 )
          .expect( 'Test' )
          .expect(function( res ) {
            expect( models.media_presentation.findOrCreate ).toHaveBeenCalled();
          })
          .end( done );
        });
      });
    });

    describe('mediaPresentation/:id', function() {
      var route = '/protected/mediaPresentation/';

      describe('GET', function() {
      });

      describe('DELETE', function() {
        var deletePresentation;

        beforeEach(function() {
          route += '1';
          deletePresentation = Q.defer();
          spyOn( models.media_presentation, 'destroy' ).andReturn( deletePresentation.promise );
        });

        afterEach(function() {
          route = '/protected/mediaPresentation/';
        });

        it('should be a defined route (not 404)', function( done ) {
          deletePresentation.reject( new Error( 'Test' ) );
          supertest.delete( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( res.statusCode ).not.toBe( 404 );
          })
          .end( done );
        });

        it('should destroy on media presentation by id', function( done ) {
          deletePresentation.reject( new Error( 'Test' ) );
          supertest.delete( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( models.media_presentation.destroy ).toHaveBeenCalled();
            expect( models.media_presentation.destroy ).toHaveBeenCalledWith( { where: { id: '1' } } );
          })
          .end( done );
        });

        it('should resolve the number of presentations destroyed', function( done ) {
          deletePresentation.resolve( 1 );
          supertest.delete( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 200 )
          .expect(function( res ) {
            expect( res.body ).toBe( 1 );
          })
          .end( done );
        });

        it('should throw an error if more than one presentation was destroyed', function( done ) {
          deletePresentation.resolve( 2 );
          supertest.delete( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 500 )
          .expect(function( res ) {
            expect( res.text ).toBe( 'Wrong number of media presentations destroyed: 2' );
          })
          .end( done );
        });

        it('should throw an error if no presentation was destroyed', function( done ) {
          deletePresentation.resolve( 0 );
          supertest.delete( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 500 )
          .expect(function( res ) {
            expect( res.text ).toBe( 'Wrong number of media presentations destroyed: 0' );
          })
          .end( done );
        });

        it('should return 500 failure for error', function( done ) {
          deletePresentation.reject( new Error( 'Test' ) );
          supertest.delete( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 500 )
          .expect(function( res ) {
            expect( res.text ).toBe( 'Test' );
            expect( models.media_presentation.destroy ).toHaveBeenCalled();
          })
          .end( done );
        });
      });
    });
  });
};