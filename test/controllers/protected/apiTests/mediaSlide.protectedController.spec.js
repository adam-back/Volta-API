var supertest = require( 'supertest' );
var app = require( '../../../../server.js' ).app;
supertest = supertest( app );

var Q = require( 'q' );
var media_slide = require( '../../../../models' ).media_slide;
var controller = require( '../../../../controllers/protected/mediaSlide.protectedController.js' );
var createToken = require( '../../../jwtHelper' ).createToken;
var token = createToken( 5 );

module.exports = function() {
  describe('MEDIA SLIDE ROUTES', function() {
    describe('mediaSlide', function() {
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
    });

    xdescribe('mediaSlide/:id', function() {
      var route = '/protected/mediaSlide/1';

      describe('POST', function() {
        it('should be a defined route (not 404)', function( done ) {
          createReport.reject();
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( res.statusCode ).not.toBe( 404 );
          })
          .end( done );
        });

        it('should save station_report to DB', function( done ) {
          createReport.resolve();
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect(function( res ) {
            expect( models.station_report.create ).toHaveBeenCalled();
            expect( models.station_report.create ).toHaveBeenCalledWith( body );
          })
          .end( done );
        });

        it('should return 204 on success', function( done ) {
          createReport.resolve();
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect( 204 )
          .expect( '' )
          .end( done );
        });

        it('should return 500 failure for error', function( done ) {
          createReport.reject( 'Test' );
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect( 500 )
          .expect( 'Test' )
          .expect( 'Content-Type', /text/ )
          .expect(function( res ) {
            expect( models.station_report.create ).toHaveBeenCalled();
            expect( models.station_report.create ).toHaveBeenCalledWith( body );
          })
          .end( done );
        });
      });
    });
  });
};