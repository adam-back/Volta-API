var models = require( '../../../../models' );
var async = require( 'async' );
var Q = require( 'q' );
var controller = require( '../../../../controllers/protected/mediaPresentation.protectedController.js' );

module.exports = function() {
  describe('PRESENTATIONS', function() {
    describe('formatMediaSlidesForPresentations', function() {
      var formatMediaSlidesForPresentations = controller.formatMediaSlidesForPresentations;

      it('should be defined as a function', function() {
        expect( typeof formatMediaSlidesForPresentations ).toBe( 'function' );
      });
    });

    describe('getMediaPresentations', function() {
      var getMediaPresentations = controller.getMediaPresentations;

      beforeEach(function() {
        findPresentations = Q.defer();
        formatSlides = Q.defer();
        spyOn( models.media_presentation, 'findAll' ).andReturn( findPresentations.promise );
        spyOn( controller, 'formatMediaSlidesForPresentations' ).andReturn( formatSlides.promise );
      });

      it('should be defined as a function', function() {
        expect( typeof getMediaPresentations ).toBe( 'function' );
      });

      it('should return a promise', function( done ) {
        var result = getMediaPresentations();
        expect( Q.isPromise( result ) ).toBe( true );
        done();
      });

      it('should find all media presentations if no query passed', function( done ) {
        findPresentations.reject();
        getMediaPresentations( null, 'id' )
        .catch(function() {
          expect( models.media_presentation.findAll ).toHaveBeenCalled();
          expect( models.media_presentation.findAll ).toHaveBeenCalledWith( {} );
          done();
        });
      });

      it('should find all media presentations within supplied query', function( done ) {
        findPresentations.reject();
        getMediaPresentations( { where: { id: 1 } }, 'id' )
        .catch(function() {
          expect( models.media_presentation.findAll ).toHaveBeenCalled();
          expect( models.media_presentation.findAll ).toHaveBeenCalledWith( { where: { id: 1 } } );
          done();
        });
      });

      it('should return presentations after formatting media slides', function( done ) {
        findPresentations.resolve( true );
        formatSlides.resolve( 'finished' );
        getMediaPresentations( null, 'id' )
        .then(function( result ) {
          expect( result ).toBe( 'finished' );
          expect( controller.formatMediaSlidesForPresentations ).toHaveBeenCalled();
          expect( controller.formatMediaSlidesForPresentations ).toHaveBeenCalledWith( true, 'id' );
          done();
        })
        .catch(function( error ) {
          expect( error ).not.toBeDefined();
          done();
        });
      });

      it('should propigate errors', function( done ) {
        findPresentations.reject( new Error( 'Test' ) );
        getMediaPresentations( { where: { id: 1 } }, 'id' )
        .catch(function( error ) {
          expect( error.message ).toBe( 'Test' );
          done();
        });
      });
    });
  });
};
