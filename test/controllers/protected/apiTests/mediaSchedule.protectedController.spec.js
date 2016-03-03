var supertest = require( 'supertest' );
var app = require( '../../../../server.js' ).app;
supertest = supertest( app );

var Q = require( 'q' );
var models = require( '../../../../models' );
var controller = require( '../../../../controllers/protected/mediaSchedule.protectedController.js' );
var createToken = require( '../../../jwtHelper' ).createToken;
var token = createToken( 5 );

module.exports = function() {
  describe('SCHEDULES', function() {
    describe('mediaSchedules/', function() {
      var route = '/protected/mediaSchedule';

      describe('GET', function() {
        var findSchedules, findPresentations;

        beforeEach(function() {
          findSchedules = Q.defer();
          findPresentations = Q.defer();
          spyOn( models.media_schedule, 'findAll' ).andReturn( findSchedules.promise );
          spyOn( models.media_presentation, 'findAll' ).andReturn( findPresentations.promise );
        });

        it('should be a defined route (not 404)', function( done ) {
          findSchedules.reject( new Error( 'Test' ) );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( res.statusCode ).not.toBe( 404 );
          })
          .end( done );
        });

        it('should find all media schedules, returning raw', function( done ) {
          findSchedules.reject( new Error( 'Test' ) );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( models.media_schedule.findAll ).toHaveBeenCalled();
            expect( models.media_schedule.findAll ).toHaveBeenCalledWith( { raw: true } );
          })
          .end( done );
        });

        it('should find all media presentations, returning raw', function( done ) {
          findSchedules.resolve();
          findPresentations.reject( new Error( 'Test' ) );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( models.media_presentation.findAll ).toHaveBeenCalled();
            expect( models.media_presentation.findAll ).toHaveBeenCalledWith( { raw: true } );
          })
          .end( done );
        });

        it('should add presentation to the schedule, returning json when done', function( done ) {
          findSchedules.resolve( [ { id: 1, media_presentation_id: 1 }, { id: 2, media_presentation_id: 3 } ] );
          findPresentations.resolve( [ { id: 1, name: 'Bob' }, { id: 3, name: 'Not Bob' } ] );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 200 )
          .expect( 'Content-Type', /json/ )
          .expect(function( res ) {
            expect( Array.isArray( res.body ) ).toBe( true );
              var expectedReturn = [ { id: 1, media_presentation_id: 1, presentations: [ { id: 1, name: 'Bob' } ] }, { id: 2, media_presentation_id: 3,  presentations: [ { id: 3, name: 'Not Bob' } ] } ];
            expect( res.body ).toEqual( expectedReturn );
          })
          .end( done );
        });

        it('should return 500 failure for error', function( done ) {
          findSchedules.reject( new Error( 'Test' ) );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 500 )
          .expect( 'Test' )
          .expect( 'Content-Type', /text/ )
          .end( done );
        });
      });

      describe('POST', function() {
      });

      describe('PATCH', function() {
      });
    });

    describe('mediaSchedule/:id', function() {
      var route = '/protected/mediaSchedule/1';

      describe('DELETE', function() {
        var destroySchedule;

        beforeEach(function() {
          destroySchedule = Q.defer();
          spyOn( models.media_schedule, 'destroy' ).andReturn( destroySchedule.promise );
        });

        it('should be a defined route (not 404)', function( done ) {
          destroySchedule.reject( new Error( 'Test' ) );
          supertest.delete( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( res.statusCode ).not.toBe( 404 );
          })
          .end( done );
        });

        it('should destroy schedule by id', function( done ) {
          destroySchedule.resolve( 1 );
          supertest.delete( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( models.media_schedule.destroy ).toHaveBeenCalled();
            expect( models.media_schedule.destroy ).toHaveBeenCalledWith( { where: { id: '1' } } );
          })
          .end( done );
        });

        it('should returning number of schedules destroyed', function( done ) {
          destroySchedule.resolve( 1 );
          supertest.delete( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 200 )
          .expect( 'Content-Type', /json/ )
          .expect(function( res ) {
            expect( res.body ).toBe( 1 );
          })
          .end( done );
        });

        it('should throw an error if more than one schedule was destroyed', function( done ) {
          destroySchedule.resolve( 2 );
          supertest.delete( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 500 )
          .expect( 'Wrong number of media schedules destroyed: 2' )
          .expect( 'Content-Type', /text/ )
          .end( done );
        });

        it('should throw an error if no schedule was destroyed', function( done ) {
          destroySchedule.resolve( 0 );
          supertest.delete( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 500 )
          .expect( 'Wrong number of media schedules destroyed: 0' )
          .expect( 'Content-Type', /text/ )
          .end( done );
        });

        it('should return 500 failure for error', function( done ) {
          destroySchedule.reject( new Error( 'Test' ) );
          supertest.delete( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 500 )
          .expect( 'Test' )
          .expect( 'Content-Type', /text/ )
          .end( done );
        });
      });
    });

    describe('mediaSchedule/serial/:serialNumber', function() {
      describe('GET', function() {
      });

      describe('POST', function() {
      });
    });
  });
};