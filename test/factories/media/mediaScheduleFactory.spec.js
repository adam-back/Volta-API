var factory = require( '../../../factories/media/mediaScheduleFactory.js' );
var models = require( '../../../models' );
var Q = require( 'q' );

module.exports = function() {
  describe('mediaScheduleFactory.js', function() {
    describe('deleteMediaScheduleByKin', function() {
      var deleteMediaScheduleByKin = factory.deleteMediaScheduleByKin;
      var destroySchedule;

      beforeEach(function() {
        destroySchedule = Q.defer();
        spyOn( models.media_schedule, 'destroy' ).andReturn( destroySchedule.promise );
      });

      it('should be defined as a function', function() {
        expect( typeof deleteMediaScheduleByKin ).toBe( 'function' );
      });

      it('should return a promise', function() {
        var result = deleteMediaScheduleByKin();
        expect( Q.isPromise( result ) ).toBe( true );
      });

      it('should destroy media schedule by kin', function( done ) {
        destroySchedule.resolve();
        deleteMediaScheduleByKin( '001-0001-001-01-K' )
        .then(function( result ) {
          expect( models.media_schedule.destroy ).toHaveBeenCalled();
          expect( models.media_schedule.destroy ).toHaveBeenCalledWith( { where: { kin: '001-0001-001-01-K' } } );
          done();
        })
        .catch(function( error ) {
          expect( error ).not.toBeDefined();
          done();
        });
      });

      it('should resolve number of rows affected', function( done ) {
        destroySchedule.resolve( 1 );
        deleteMediaScheduleByKin( '001-0001-001-01-K' )
        .then(function( result ) {
          expect( result ).toBe( 1 );
          done();
        })
        .catch(function( error ) {
          expect( error ).not.toBeDefined();
          done();
        });
      });

      it('should propagate errors', function( done ) {
        destroySchedule.reject( new Error( 'Test' ) );
        deleteMediaScheduleByKin( '001-0001-001-01-K' )
        .catch(function( error ) {
          expect( error ).toEqual( new Error( 'Test' ) );
          done();
        });
      });
    });

    describe('addMediaScheduleLocal', function() {
      var addMediaScheduleLocal = factory.addMediaScheduleLocal;
      var findOrCreateMediaSchedule, schedule;

      beforeEach(function() {
        findOrCreateMediaSchedule = Q.defer();
        spyOn( models.media_schedule, 'findOrCreate' ).andReturn( findOrCreateMediaSchedule.promise );
        schedule = models.media_schedule.build( { schedule: 'Yes', kin: '001-0001-001-01-K', serial_number: 'ABC', active: true } );
      });

      it('should be defined as a function', function() {
        expect( typeof addMediaScheduleLocal ).toBe( 'function' );
      });

      it('should return a promise', function() {
        var result = addMediaScheduleLocal( schedule );
        expect( Q.isPromise( result ) ).toBe( true );
      });

      it('should findOrCreate media schedule by kin', function( done ) {
        findOrCreateMediaSchedule.resolve();
        addMediaScheduleLocal( schedule )
        .then(function( result ) {
          expect( models.media_schedule.findOrCreate ).toHaveBeenCalled();
          expect( models.media_schedule.findOrCreate ).toHaveBeenCalledWith( { where: { kin: schedule.kin }, defaults: schedule } );
          done();
        })
        .catch(function( error ) {
          expect( error ).not.toBeDefined();
          done();
        });
      });

      it('should resolve spread, schedule and created boolean', function( done ) {
        findOrCreateMediaSchedule.resolve( [ schedule, true ] );
        addMediaScheduleLocal( schedule )
        .spread(function( foundSchedule, created ) {
          expect( foundSchedule.get( { plain: true } ) ).toEqual( schedule.get( { plain: true } ) );
          expect( created ).toBe( true );
          done();
        })
        .catch(function( error ) {
          expect( error ).not.toBeDefined();
          done();
        });
      });

      it('should propagate errors', function( done ) {
        findOrCreateMediaSchedule.reject( new Error( 'Test' ) );
        addMediaScheduleLocal( schedule )
        .catch(function( error ) {
          expect( error ).toEqual( new Error( 'Test' ) );
          done();
        });
      });
    });

    describe('getMediaScheduleByKinLocal', function() {
      var getMediaScheduleByKinLocal = factory.getMediaScheduleByKinLocal;
      var findSchedules;

      beforeEach(function() {
        findSchedules = Q.defer();
        spyOn( models.media_schedule, 'findAll' ).andReturn( findSchedules.promise );
      });

      it('should be defined as a function', function() {
        expect( typeof getMediaScheduleByKinLocal ).toBe( 'function' );
      });

      it('should return a promise', function() {
        var result = getMediaScheduleByKinLocal( '001-0001-001-01-K' );
        expect( Q.isPromise( result ) ).toBe( true );
      });

      it('should findAll media schedules by kin', function( done ) {
        findSchedules.resolve();
        getMediaScheduleByKinLocal( '001-0001-001-01-K' )
        .then(function( result ) {
          expect( models.media_schedule.findAll ).toHaveBeenCalled();
          expect( models.media_schedule.findAll ).toHaveBeenCalledWith( { where: { kin: '001-0001-001-01-K' } } );
          done();
        })
        .catch(function( error ) {
          expect( error ).not.toBeDefined();
          done();
        });
      });

      it('should resolve number of rows affected', function( done ) {
        findSchedules.resolve( 1 );
        getMediaScheduleByKinLocal( '001-0001-001-01-K' )
        .then(function( result ) {
          expect( result ).toBe( 1 );
          done();
        })
        .catch(function( error ) {
          expect( error ).not.toBeDefined();
          done();
        });
      });

      it('should propagate errors', function( done ) {
        findSchedules.reject( new Error( 'Test' ) );
        getMediaScheduleByKinLocal( '001-0001-001-01-K' )
        .catch(function( error ) {
          expect( error ).toEqual( new Error( 'Test' ) );
          done();
        });
      });
    });

    describe('replaceMediaScheduleLocal', function() {
      var replaceMediaScheduleLocal = factory.replaceMediaScheduleLocal;
      var newSchedule, deleteScheduleByKin, addSchedule, findPresentations;

      beforeEach(function() {
        newSchedule = { schedule: { day: 'Monday', presentation: { id: 1 } }, kin: '001-0001-001-01-K', serial_number: 'ABC', active: true };
        getScheduleByKin = Q.defer();
        deleteScheduleByKin = Q.defer();
        addSchedule = Q.defer();
        findPresentations = Q.defer();
        spyOn( factory, 'deleteMediaScheduleByKin' ).andReturn( deleteScheduleByKin.promise );
        spyOn( factory, 'addMediaScheduleLocal' ).andReturn( addSchedule.promise );
        spyOn( models.media_presentation, 'findAll' ).andReturn( findPresentations.promise );
      });

      it('should be defined as a function', function() {
        expect( typeof replaceMediaScheduleLocal ).toBe( 'function' );
      });

      it('should return a promise', function() {
        var result = replaceMediaScheduleLocal( newSchedule );
        expect( Q.isPromise( result ) ).toBe( true );
      });

      it('should delete the existing schedule', function( done ) {
        deleteScheduleByKin.reject();
        replaceMediaScheduleLocal( newSchedule )
        .catch(function() {
          expect( factory.deleteMediaScheduleByKin ).toHaveBeenCalled();
          expect( factory.deleteMediaScheduleByKin ).toHaveBeenCalledWith( '001-0001-001-01-K' );
          done();
        });
      });

      it('should add the new media schedule', function( done ) {
        var scheduleForComparison = JSON.parse( JSON.stringify( newSchedule ) );
        var presentation = scheduleForComparison.schedule.presentation;
        delete scheduleForComparison.schedule.presentation;

        // add presentation to schedule
        scheduleForComparison.schedule.presentation = presentation.id;
        scheduleForComparison.media_presentation_id = presentation.id;

        // Stringify so that the schedule can be saved to the database
        scheduleForComparison.schedule = JSON.stringify( scheduleForComparison.schedule );

        deleteScheduleByKin.resolve( 1 );
        addSchedule.reject();
        replaceMediaScheduleLocal( newSchedule )
        .catch(function() {
          expect( factory.addMediaScheduleLocal ).toHaveBeenCalled();
          expect( factory.addMediaScheduleLocal ).toHaveBeenCalledWith( scheduleForComparison );
          done();
        });
      });

      it('should find all presentations by id', function( done ) {
        deleteScheduleByKin.resolve( 1 );
        addSchedule.resolve( [ null, true ] );
        findPresentations.reject();
        replaceMediaScheduleLocal( newSchedule )
        .catch(function() {
          expect( models.media_presentation.findAll ).toHaveBeenCalled();
          expect( models.media_presentation.findAll ).toHaveBeenCalledWith( { where: { id: 1 } } );
          done();
        });
      });

      it('should return added schedule with presentations attached', function( done ) {
        deleteScheduleByKin.resolve( 1 );
        var schedule = {
          id: 2,
          get: function() {
            return void( 0 );
          }
        };
        spyOn( schedule, 'get' ).andReturn( { id: 2 } );
        addSchedule.resolve( [ schedule, true ] );
        findPresentations.resolve( [ 1, 2, 3 ] );
        replaceMediaScheduleLocal( newSchedule )
        .then(function( result ) {
          expect( schedule.get ).toHaveBeenCalled();
          expect( schedule.get ).toHaveBeenCalledWith( { plain: true } );
          expect( typeof result ).toBe( 'object' );
          expect( result.id ).toBe( 2 );
          expect( result.presentations ).toEqual( [ 1, 2, 3 ] );
          done();
        })
        .catch(function( error ) {
          expect( error ).not.toBeDefined();
          done();
        });
      });

      it('should propagate errors', function( done ) {
        deleteScheduleByKin.reject( new Error( 'Test' ) );
        replaceMediaScheduleLocal( newSchedule )
        .catch(function( error ) {
          expect( error ).toEqual( new Error( 'Test' ) );
          done();
        });
      });
    });
    });

    describe('getMediaPlayersThatHaveGoneAWOL', function() {
      var findMediaSchedules;
      beforeEach(function() {
        findMediaSchedules = Q.defer();
        spyOn( models.media_schedule, 'findAll' ).andReturn( findMediaSchedules.promise );
      });

      it( 'should find media schedules that have gone AWOL', function( done ) {
        var testSchedules = [ { id: 1 } ];

        findMediaSchedules.resolve( [ { id: 1 } ] );
        factory.getMediaPlayersThatHaveGoneAWOL()
        .then( function( schedules ) {
          expect( models.media_schedule.findAll ).toHaveBeenCalled();
          expect( models.media_schedule.findAll.calls[ 0 ].args[ 0 ].hasOwnProperty( 'where' ) ).toBe( true );
          expect( models.media_schedule.findAll.calls[ 0 ].args[ 0 ].where.hasOwnProperty( 'last_check_in' ) ).toBe( true );
          expect( models.media_schedule.findAll.calls[ 0 ].args[ 0 ].where.last_check_in.hasOwnProperty( '$gt' ) ).toBe( true );
          expect( models.media_schedule.findAll.calls[ 0 ].args[ 0 ].raw ).toBe( true );
          expect( schedules ).toEqual( testSchedules );
          done();
        })
        .catch( function( error ) {
          expect( error ).toBe( undefined );
          done();
        });
      });
    });
};
