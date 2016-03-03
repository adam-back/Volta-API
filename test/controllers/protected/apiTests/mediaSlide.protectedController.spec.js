var supertest = require( 'supertest' );
var app = require( '../../../../server.js' ).app;
supertest = supertest( app );

var Q = require( 'q' );
var media_slide = require( '../../../../models' ).media_slide;
var controller = require( '../../../../controllers/protected/mediaSlide.protectedController.js' );
var createToken = require( '../../../jwtHelper' ).createToken;
var token = createToken( 5 );

module.exports = function() {
  describe('SLIDES', function() {
    describe('mediaSlide/', function() {
      var route = '/protected/mediaSlide';

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

        it('should resolve json of slides', function( done ) {
          var Slides = [ 1 ];
          getAll.resolve( Slides );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 'Content-Type', /json/ )
          .expect( Slides )
          .expect( 200 )
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

      describe('POST', function() {
        var create, slideBody;

        beforeEach(function() {
          create = Q.defer();
          spyOn( media_slide, 'findOrCreate' ).andReturn( create.promise );
          slideBody = { id: 1, name: 'Chevy' };
        });

        it('should be a defined route (not 404)', function( done ) {
          create.reject();
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( slideBody )
          .expect(function( res ) {
            expect( res.statusCode ).not.toBe( 404 );
          })
          .end( done );
        });

        it('should find or create media slide', function( done ) {
          create.resolve( [ 'yes', true ] );
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( slideBody )
          .expect(function( res ) {
            expect( media_slide.findOrCreate ).toHaveBeenCalled();
            expect( media_slide.findOrCreate ).toHaveBeenCalledWith( { where: { name: 'Chevy' }, defaults: { id: 1, name: 'Chevy' } } );
          })
          .end( done );
        });

        it('should resolve slide if created', function( done ) {
          create.resolve( [ { name: 'Chevy' }, true ] );
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( slideBody )
          .expect( 'Content-Type', /json/ )
          .expect( { name: 'Chevy' } )
          .end( done );
        });

        it('should resolve slide if found', function( done ) {
          create.resolve( [ { name: 'Chevy' }, false ] );
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( slideBody )
          .expect( 'Content-Type', /json/ )
          .expect( { name: 'Chevy' } )
          .end( done );
        });

        it('should return 500 failure for error', function( done ) {
          create.reject( 'Test' );
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( slideBody )
          .expect( 500 )
          .expect( 'Test' )
          .expect( 'Content-Type', /text/ )
          .expect(function( res ) {
            expect( media_slide.findOrCreate ).toHaveBeenCalled();
          })
          .end( done );
        });
      });
    });

    describe('mediaSlide/:id', function() {
      var route = '/protected/mediaSlide/1';

      describe('DELETE', function() {
        var destroySlide;

        beforeEach(function() {
          destroySlide = Q.defer();
          spyOn( media_slide, 'destroy' ).andReturn( destroySlide.promise );
        });

        it('should be a defined route (not 404)', function( done ) {
          destroySlide.reject();
          supertest.delete( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( res.statusCode ).not.toBe( 404 );
          })
          .end( done );
        });

        it('should destory slide by id', function( done ) {
          var Slides = [ 1 ];
          destroySlide.resolve( Slides );
          supertest.delete( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( media_slide.destroy ).toHaveBeenCalled();
            expect( media_slide.destroy ).toHaveBeenCalledWith( { where: { id: '1' } } );
          })
          .end( done );
        });


        it('should resolve json of slide after destroy', function( done ) {
          var Slides = [ 1 ];
          destroySlide.resolve( Slides );
          supertest.delete( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 'Content-Type', /json/ )
          .expect( Slides )
          .expect( 200 )
          .end( done );
        });

        it('should return 500 failure for error', function( done ) {
          destroySlide.reject( 'Test' );
          supertest.delete( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 500 )
          .expect( 'Test' )
          .expect( 'Content-Type', /text/ )
          .expect(function( res ) {
            expect( media_slide.destroy ).toHaveBeenCalled();
            expect( media_slide.destroy ).toHaveBeenCalledWith( { where: { id: '1' } } );
          })
          .end( done );
        });
      });
    });
  });
};