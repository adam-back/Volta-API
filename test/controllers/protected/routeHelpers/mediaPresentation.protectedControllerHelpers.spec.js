var models = require( '../../../../models' );
var async = require( 'async' );
var Q = require( 'q' );
var controller = require( '../../../../controllers/protected/mediaPresentation.protectedController.js' );

module.exports = function() {
  describe('PRESENTATIONS', function() {
    describe('formatMediaSlidesForPresentations', function() {
      var formatMediaSlidesForPresentations = controller.formatMediaSlidesForPresentations;
      var presentation, getSlides;

      beforeEach(function() {
        presentation = models.media_presentation.build( { name: 'Bob', active: false, slide_order: [ 1, 2 ] } );
        getSlides = Q.defer();
        spyOn( presentation, 'getMediaSlides' ).andReturn( getSlides.promise );
      });

      it('should be defined as a function', function() {
        expect( typeof formatMediaSlidesForPresentations ).toBe( 'function' );
      });

      it('should return a promise', function( done ) {
        var result = formatMediaSlidesForPresentations( [] );
        expect( Q.isPromise( result ) ).toBe( true );
        done();
      });

      it('should reject if no presentations are passed', function( done ) {
        formatMediaSlidesForPresentations( null, 'id' )
        .catch(function( error ) {
          expect( error ).toBe( 'No presentations found' );

          formatMediaSlidesForPresentations( [], 'id' )
          .catch(function( secondError ) {
            expect( secondError ).toBe( 'No presentations found' );
            done();
          });
        });
      });

      it('should loop over each presentation', function( done ) {
        spyOn( async, 'each' ).andCallThrough();
        getSlides.reject( 'Test' );
        formatMediaSlidesForPresentations( [ presentation ], 'id' )
        .catch(function() {
          expect( async.each ).toHaveBeenCalled();
          expect( async.each.calls[ 0 ].args[ 0 ] ).toEqual( [ presentation ] );
          done();
        });
      });

      it('should get associate media slides for presentation', function( done ) {
        getSlides.reject( 'Test' );
        formatMediaSlidesForPresentations( [ presentation ], 'id' )
        .catch(function() {
          expect( presentation.getMediaSlides ).toHaveBeenCalled();
          expect( presentation.getMediaSlides ).toHaveBeenCalledWith();
          done();
        });
      });

      it('should create plain copies of the presentation', function( done ) {
        spyOn( presentation, 'get' ).andReturn( Q.reject( 'Get fail' ) );
        getSlides.resolve();
        formatMediaSlidesForPresentations( [ presentation ], 'id' )
        .catch(function() {
          expect( presentation.get ).toHaveBeenCalled();
          expect( presentation.get ).toHaveBeenCalledWith( { plain: true } );
          done();
        });
      });

      it('should return presentations after adding slideIds to them in slide_order', function( done ) {
        // notice order is off, should be corrected by presentation.slide_order
        getSlides.resolve( [ { id: 2, mediaUrl: 'URL2' }, { id: 1, mediaUrl: 'URL1'  } ] );
        formatMediaSlidesForPresentations( [ presentation ], 'mediaUrl' )
        .then(function( result ) {
          expect( Array.isArray( result ) ).toBe( true );
          expect( result.length ).toBe( 1 );
          expect( typeof result[ 0 ] ).toBe( 'object' );
          var plainPresentation = result[ 0 ];
          expect( plainPresentation.hasOwnProperty( 'name' ) ).toBe( true );
          expect( plainPresentation.name ).toBe( 'Bob' );
          expect( plainPresentation.hasOwnProperty( 'active' ) ).toBe( true );
          expect( plainPresentation.active ).toBe( false );
          expect( plainPresentation.hasOwnProperty( 'slide_order' ) ).toBe( true );
          expect( plainPresentation.slide_order ).toEqual( [ 1, 2 ] );
          expect( plainPresentation.hasOwnProperty( 'slideIds' ) ).toBe( true );
          expect( plainPresentation.slideIds ).toEqual( [ 'URL1', 'URL2' ] );
          done();
        })
        .catch(function( error ) {
          expect( error ).not.toBeDefined();
          done();
        });
      });

      it('should throw error if slides fetched don\'t match ids in slide_order', function( done ) {
        // slide_order is [ 1, 2 ], so missing id 2 here
        getSlides.resolve( [ { id: 1, mediaUrl: 'URL1'  } ] );
        formatMediaSlidesForPresentations( [ presentation ], 'mediaUrl' )
        .catch(function( error ) {
          expect( error ).toBe( 'Slides are missing.' );
          done();
        });
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

      it('should propagate errors', function( done ) {
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
