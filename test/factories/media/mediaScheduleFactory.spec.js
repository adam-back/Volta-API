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
  });
};