var supertest = require( 'supertest' );
var app = require( '../../../../server.js' ).app;
supertest = supertest( app );

var Q = require( 'q' );
var models = require( '../../../../models' );
var mediaScheduleFactory = require( '../../../../factories/media/mediaScheduleFactory.js' );
var createToken = require( '../../../jwtHelper' ).createToken;
var token = createToken();

var sequelize = models.sequelize;


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
        var newMediaSchedule, findOrCreateSchedule, body;

        var updateSchedule;
        beforeEach(function() {
          updateSchedule = Q.defer();
          spyOn( models.media_schedule, 'findOne' ).andReturn( updateSchedule.promise );
        });

        beforeEach(function() {
          newMediaSchedule = models.media_schedule.build( { kin: '001-0001-001-01-K' } );
          findOrCreateSchedule = Q.defer();
          body = {
            kin: '001-0001-001-01-K',
            playingPresentation: 42,
            downloadedPresentations: [ 1, 3, 5, 42 ]
          };
          spyOn( models.media_schedule, 'findOrCreate' ).andReturn( findOrCreateSchedule.promise );
        });

        it('should be a defined route (not 404)', function( done ) {
          findOrCreateSchedule.reject( new Error( 'Test' ) );
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect(function( res ) {
            expect( res.statusCode ).not.toBe( 404 );
          })
          .end( done );
        });

        it('should findOrCreate a new media schedule by kin', function( done ) {
          findOrCreateSchedule.reject( new Error( 'Test' ) );
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect(function( res ) {
            expect( models.media_schedule.findOrCreate ).toHaveBeenCalled();
            expect( models.media_schedule.findOrCreate ).toHaveBeenCalledWith( { where: { kin: '001-0001-001-01-K' }, defaults: body } );
          })
          .end( done );
        });

        it('should associate schedule with media presentation', function( done ) {
          var spread = [ { schedule: true, setMediaPresentations: function() { return void( 0 ); } }, true ];
          spread[ 0 ].schedule = JSON.stringify( { presentation: 1 } );
          spyOn( spread[ 0 ], 'setMediaPresentations' );
          findOrCreateSchedule.resolve( spread );

          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect(function( res ) {
            expect( spread[ 0 ].setMediaPresentations ).toHaveBeenCalled();
            expect( spread[ 0 ].setMediaPresentations ).toHaveBeenCalledWith( [ 1 ] );
          })
          .end( done );
        });

        it('should return JSON of successfullyAddedMediaSchedule: true on success', function( done ) {
          var spread = [ { schedule: true, setMediaPresentations: function() { return void( 0 ); } }, true ];
          spread[ 0 ].schedule = JSON.stringify( { presentation: 1 } );
          findOrCreateSchedule.resolve( spread );

          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect( 200 )
          .expect( 'Content-Type', /json/ )
          .expect( { successfullyAddedMediaSchedule: true } )
          .end( done );
        });

        it('should throw error if schedule already exists for kin', function( done ) {
          findOrCreateSchedule.resolve( [ null, false ] );
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect( 500 )
          .expect( 'Content-Type', /text/ )
          .expect( 'Schedule already exists for kin 001-0001-001-01-K' )
          .end( done );
        });

        it('should return 500 failure for error', function( done ) {
          findOrCreateSchedule.reject( new Error( 'Test' ) );
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect( 500 )
          .expect( 'Test' )
          .expect( 'Content-Type', /text/ )
          .end( done );
        });


        // NOTE: NEW!
        it('should update downloaded presentations', function( done ) {
          var route = '/protected/mediaSchedule/notification/downloadedPresentations/1';
          var saveSchedule = Q.defer();

          var mediaScheduleToUpdate = {
            last_check_in: null,
            save: jasmine.createSpy('save media schedule').andReturn( saveSchedule.promise )
          };

          updateSchedule.resolve( mediaScheduleToUpdate );
          saveSchedule.resolve( mediaScheduleToUpdate );

          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect( 200 )
          .expect( 'Content-Type', /json/ )
          .expect([{
            last_check_in: null,
            downloaded_presentations: body.downloadedPresentations
          }])
          .end( done );
        });

        it('should fail to update downloaded presentations', function( done ) {
          var route = '/protected/mediaSchedule/notification/downloadedPresentations/1';
          var saveSchedule = Q.defer();

          updateSchedule.resolve( null );

          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect( 500 )
          .expect( 'Content-Type', /text/ )
          .end( done );
        });

        it('should update playing presentation', function( done ) {
          var route = '/protected/mediaSchedule/notification/playingPresentation/1';
          var saveSchedule = Q.defer();

          var mediaScheduleToUpdate = {
            last_check_in: null,
            save: jasmine.createSpy('save media schedule').andReturn( saveSchedule.promise )
          };

          updateSchedule.resolve( mediaScheduleToUpdate );
          saveSchedule.resolve( mediaScheduleToUpdate );

          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect( 200 )
          .expect( 'Content-Type', /json/ )
          .expect([{
            last_check_in: null,
            playing_presentation: body.playingPresentation
          }])
          .end( done );
        });

        it('should fail to update playing presentation', function( done ) {
          var route = '/protected/mediaSchedule/notification/playingPresentation/1';
          var saveSchedule = Q.defer();

          updateSchedule.resolve( null );

          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect( 500 )
          .expect( 'Content-Type', /text/ )
          .end( done );
        });
      });

      describe('PATCH', function() {
        var replaceSchedule, body;

        beforeEach(function() {
          replaceSchedule = Q.defer();
          body = { schedule: true };
          spyOn( mediaScheduleFactory, 'replaceMediaScheduleLocal' ).andReturn( replaceSchedule.promise );
        });

        it('should be a defined route (not 404)', function( done ) {
          replaceSchedule.reject( new Error( 'Test' ) );
          supertest.patch( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect(function( res ) {
            expect( res.statusCode ).not.toBe( 404 );
          })
          .end( done );
        });

        it('should replaceMediaScheduleLocal', function( done ) {
          replaceSchedule.resolve();
          supertest.patch( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect(function( res ) {
            expect( mediaScheduleFactory.replaceMediaScheduleLocal ).toHaveBeenCalled();
            expect( mediaScheduleFactory.replaceMediaScheduleLocal ).toHaveBeenCalledWith( body );
          })
          .end( done );
        });

        it('should return JSON new schedule', function( done ) {
          replaceSchedule.resolve( body );
          supertest.patch( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect( 200 )
          .expect( 'Content-Type', /json/ )
          .expect( body )
          .end( done );
        });

        it('should return 500 failure for error', function( done ) {
          replaceSchedule.reject( new Error( 'Test' ) );
          supertest.patch( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect( 500 )
          .expect( 'Test' )
          .expect( 'Content-Type', /text/ )
          .end( done );
        });
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
      var route = '/protected/mediaSchedule/serial/1';

      describe('GET', function() {
        var updateSchedule;

        beforeEach(function() {
          updateSchedule = Q.defer();
          spyOn( models.media_schedule, 'findOne' ).andReturn( updateSchedule.promise );
        });

        it('should be a defined route (not 404)', function( done ) {
          updateSchedule.reject( new Error( 'Test' ) );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( res.statusCode ).not.toBe( 404 );
          })
          .end( done );
        });

        it('should find schedules by serial number and update last_check_in', function( done ) {
          var saveSchedule = Q.defer();
          var mediaScheduleToUpdate = {
            last_check_in: null,
            save: jasmine.createSpy('save media schedule').andReturn( saveSchedule.promise )
          };

          updateSchedule.resolve( mediaScheduleToUpdate );
          saveSchedule.resolve( mediaScheduleToUpdate );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 200 )
          .expect(function( res ) {
            expect( mediaScheduleToUpdate.save ).toHaveBeenCalled();
            expect( mediaScheduleToUpdate.last_check_in ).toNotEqual( null );
          })
          .end( done );
        });

        it('should return JSON of schedules', function( done ) {
          var saveSchedule = Q.defer();
          var savedMediaSchedule = { test: true };
          var mediaScheduleToUpdate = {
            last_check_in: null,
            save: jasmine.createSpy('save media schedule').andReturn( saveSchedule.promise )
          };
          updateSchedule.resolve( mediaScheduleToUpdate );
          saveSchedule.resolve( savedMediaSchedule );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 200 )
          .expect( 'Content-Type', /json/ )
          .expect( [ savedMediaSchedule ] )
          .end( done );
        });

        it('should throw an error if no schedules were found', function( done ) {
          updateSchedule.resolve( undefined );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 500 )
          .expect( 'No Media Schedule found for serial_number 1' )
          // .expect( 'No schedules for serialNumber 1' )
          .expect( 'Content-Type', /text/ )
          .end( done );
        });

        it('should return 500 failure for error', function( done ) {
          updateSchedule.reject( new Error( 'Test' ) );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 500 )
          .expect( 'Test' )
          .expect( 'Content-Type', /text/ )
          .end( done );
        });
      });

      describe('POST', function() {
        var body, findSchedule, foundSchedule, saveSchedule;

        beforeEach(function() {
          body = {
            changes: [ [ 'schedule', null, 'changes' ] ],
            kin: '001-0001-001-01-K'
          };
          findSchedule = Q.defer();
          foundSchedule = models.media_schedule.build( { kin: '001-0001-001-01-K' } );
          saveSchedule = Q.defer();
          spyOn( models.media_schedule, 'findOne' ).andReturn( findSchedule.promise );
          spyOn( foundSchedule, 'save' ).andReturn( saveSchedule.promise );
        });

        it('should be a defined route (not 404)', function( done ) {
          findSchedule.reject( new Error( 'Test' ) );
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect(function( res ) {
            expect( res.statusCode ).not.toBe( 404 );
          })
          .end( done );
        });

        it('should find one media schedules by kin', function( done ) {
          findSchedule.reject( new Error( 'Test' ) );
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect(function( res ) {
            expect( models.media_schedule.findOne ).toHaveBeenCalled();
            expect( models.media_schedule.findOne ).toHaveBeenCalledWith( { where: { kin: '001-0001-001-01-K' } } );
          })
          .end( done );
        });

        it('should update media schedule and save changes', function( done ) {
          findSchedule.resolve( foundSchedule );
          saveSchedule.reject( new Error( 'Test' ) );
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect(function( res ) {
            expect( foundSchedule.save ).toHaveBeenCalled();
            expect( foundSchedule.save ).toHaveBeenCalledWith();
            expect( foundSchedule.changed( 'schedule' ) ).toBe( true );
            expect( foundSchedule.schedule ).toBe( 'changes' );
          })
          .end( done );
        });

        it('should resolve JSON of updated schedule', function( done ) {
          findSchedule.resolve( foundSchedule );
          saveSchedule.resolve( foundSchedule );
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect( 200 )
          .expect( 'Content-Type', /json/ )
          .expect(function( res ) {
            expect( res.body.schedule ).toBe( 'changes' );
            expect( res.body.kin ).toBe( '001-0001-001-01-K' );
          })
          .end( done );
        });

        it('should return 500 failure for error', function( done ) {
          findSchedule.reject( new Error( 'Test' ) );
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect( 500 )
          .expect( 'Test' )
          .expect( 'Content-Type', /text/ )
          .end( done );
        });

        it('should return 404 if no schedule found by kin', function( done ) {
          findSchedule.resolve( null );
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect( 404 )
          .expect( 'No Media Schedule found for kin 001-0001-001-01-K' )
          .expect( 'Content-Type', /text/ )
          .end( done );
        });
      });
    });
    });

    describe('mediaSchedule/checkForIssues', function() {
      describe('GET', function() {
        var route = '/protected/mediaSchedule/checkForIssues';
        var getMediaPlayersThatHaveGoneAWOL;

        beforeEach( function() {
          getMediaPlayersThatHaveGoneAWOL = Q.defer();
          spyOn( mediaScheduleFactory, 'getMediaPlayersThatHaveGoneAWOL' ).andReturn( getMediaPlayersThatHaveGoneAWOL.promise );
        });

        it('should be a defined route (not 404)', function( done ) {
          getMediaPlayersThatHaveGoneAWOL.reject( new Error( 'Test' ) );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( res.statusCode ).not.toBe( 404 );
          })
          .end( done );
        });

        it('should get media players that have gone AWOL', function( done ) {
          var awolMediaPlayers = [ { id: 1 } ];
          getMediaPlayersThatHaveGoneAWOL.resolve( awolMediaPlayers );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 200 )
          .expect( 'Content-Type', /json/ )
          .expect( {
            haveNotCheckedIn: awolMediaPlayers
          })
          .end( done );
        });
      });
    });
};
