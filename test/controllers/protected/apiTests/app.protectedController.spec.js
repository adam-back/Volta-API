var supertest = require( 'supertest' );
var app = require( '../../../../server.js' ).app;
supertest = supertest( app );
var config    = require( '../../../../config/config' ).development;
var Q = require( 'q' );
var async     = require( 'async' );
var models = require( '../../../../models' );
var controller = require( '../../../../controllers/protected/app.protectedController.js' );
var cache = require( '../../../../factories/geocodeCache.js' );
var appFactory = require( '../../../../factories/appFactory.js' );
var calculateDistance = require( '../../../../factories/distanceFactory.js' ).getDistanceFromLatLonInMiles;
var createToken = require( '../../../jwtHelper' ).createToken;
var token = createToken( 5 );

module.exports = function() {
  describe('APP', function() {
    describe('app/stations', function() {
      var route = '/protected/app/stations';

      describe('GET', function() {
        var findAllStations, connectStations, findUser, groupIntoKins, addGalleryImages, geocodeIfNeeded;

        beforeEach(function() {
          findAllStations = Q.defer();
          connectStations = Q.defer();
          findUser = Q.defer();
          groupIntoKins = Q.defer();
          addGalleryImages = Q.defer();
          geocodeIfNeeded = Q.defer();

          spyOn( models.station, 'findAll' ).andReturn( findAllStations.promise );
          spyOn( appFactory, 'connectStationsWithPlugsAndSponsors' ).andReturn( connectStations.promise );
          spyOn( models.user, 'find' ).andReturn( findUser.promise );
          spyOn( appFactory, 'groupByKin' ).andReturn( groupIntoKins.promise );
          spyOn( appFactory, 'attachImages' ).andReturn( addGalleryImages.promise );
          spyOn( cache, 'geocodeGroupsWithoutGPS' ).andReturn( geocodeIfNeeded.promise );
          spyOn( appFactory, 'findDistances' ).andReturn( [ 'done' ] );
        });

        afterEach(function() {
          route = '/protected/app/stations';
        });

        it('should be a defined route (not 404)', function( done ) {
          findAllStations.reject();
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( res.statusCode ).not.toBe( 404 );
          })
          .end( done );
        });

        it('should find all stations', function( done ) {
          findAllStations.reject();
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( models.station.findAll ).toHaveBeenCalled();
            expect( models.station.findAll ).toHaveBeenCalledWith();
          })
          .end( done );
        });

        it('should connect stations with plugs and sponsors', function( done ) {
          findAllStations.resolve( [ 1 ] );
          connectStations.reject();
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( appFactory.connectStationsWithPlugsAndSponsors ).toHaveBeenCalled();
            expect( appFactory.connectStationsWithPlugsAndSponsors ).toHaveBeenCalledWith( [ 1 ] );
          })
          .end( done );
        });

        it('should find user if logged in', function( done ) {
          findAllStations.resolve( [ 1 ] );
          connectStations.resolve( [ 1, 2 ] );
          findUser.reject();
          route += '?id=1';
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( models.user.find ).toHaveBeenCalled();
            expect( models.user.find ).toHaveBeenCalledWith( { where: { id: '1' } } );
          })
          .end( done );
        });

        it('should group stations by kin with user\'s favorites', function( done ) {
          findAllStations.resolve( [ 1 ] );
          connectStations.resolve( [ 1, 2 ] );
          findUser.resolve( { favorite_stations: 'faves' } );
          groupIntoKins.reject();
          route += '?id=1';
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( appFactory.groupByKin ).toHaveBeenCalled();
            expect( appFactory.groupByKin ).toHaveBeenCalledWith( [ 1, 2 ], 'faves' );
          })
          .end( done );
        });

        it('should group stations by kin without user\'s favorites', function( done ) {
          findAllStations.resolve( [ 1 ] );
          connectStations.resolve( [ 1, 2 ] );
          groupIntoKins.reject();
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( models.user.find ).not.toHaveBeenCalled();
            expect( appFactory.groupByKin ).toHaveBeenCalled();
            expect( appFactory.groupByKin ).toHaveBeenCalledWith( [ 1, 2 ] );
          })
          .end( done );
        });

        it('should attach images to station groups', function( done ) {
          findAllStations.resolve( [ 1 ] );
          connectStations.resolve( [ 1, 2 ] );
          groupIntoKins.resolve( [ 1, 2, 3 ] );
          addGalleryImages.reject();
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( appFactory.attachImages ).toHaveBeenCalled();
            expect( appFactory.attachImages ).toHaveBeenCalledWith( [ 1, 2, 3 ] );
          })
          .end( done );
        });

        it('should geocode groups without gps', function( done ) {
          findAllStations.resolve( [ 1 ] );
          connectStations.resolve( [ 1, 2 ] );
          groupIntoKins.resolve( [ 1, 2, 3 ] );
          addGalleryImages.resolve( { 1: { gps: null } } );
          geocodeIfNeeded.reject();
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( cache.geocodeGroupsWithoutGPS.calls.length ).toBe( 1 );
            expect( cache.geocodeGroupsWithoutGPS ).toHaveBeenCalledWith( { 1: { gps: null } } );
          })
          .end( done );
        });

        it('should not geocode groups already with gps', function( done ) {
          findAllStations.resolve( [ 1 ] );
          connectStations.resolve( [ 1, 2 ] );
          groupIntoKins.resolve( [ 1, 2, 3 ] );
          addGalleryImages.resolve( { 2: { gps: [ 1, 2 ] } } );
          geocodeIfNeeded.reject();
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( cache.geocodeGroupsWithoutGPS ).toHaveBeenCalled();
            expect( cache.geocodeGroupsWithoutGPS ).toHaveBeenCalledWith( {} );
          })
          .end( done );
        });

        it('should return JSON of formatted stations', function( done ) {
          findAllStations.resolve( [ 1 ] );
          connectStations.resolve( [ 1, 2 ] );
          groupIntoKins.resolve( [ 1, 2, 3 ] );
          addGalleryImages.resolve( { 1: { kin: 1, gps: null }, 2: { kin: 2, gps: [ 1, 2 ] } } );
          geocodeIfNeeded.resolve( [ { kin: 1, gps: [ 3, 4 ] } ] );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 'Content-Type', /json/ )
          .expect(function( res ) {
            expect( appFactory.findDistances ).not.toHaveBeenCalled();
            expect( Array.isArray( res.body ) ).toBe( true );
            expect( res.body.length ).toBe( 2 );
            // kin 2 first because it didn't need geocoding
            expect( res.body[ 0 ] ).toEqual( { kin: 2, gps: [ 1, 2 ] } );
            expect( res.body[ 1 ] ).toEqual( { kin: 1, gps: [ 3, 4 ] } );
          })
          .end( done );
        });

        it('should find distances to stations if userCoords provided', function( done ) {
          findAllStations.resolve( [ 1 ] );
          connectStations.resolve( [ 1, 2 ] );
          groupIntoKins.resolve( [ 1, 2, 3 ] );
          addGalleryImages.resolve( { 1: { kin: 1, gps: null }, 2: { kin: 2, gps: [ 1, 2 ] } } );
          geocodeIfNeeded.resolve( [ { kin: 1, gps: [ 3, 4 ] } ] );
          route += '?userCoords[]=5&userCoords[]=6';
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 'Content-Type', /json/ )
          .expect(function( res ) {
            expect( appFactory.findDistances ).toHaveBeenCalled();
            expect( appFactory.findDistances ).toHaveBeenCalledWith( [ '5', '6' ], [ { kin: 2, gps: [ 1, 2 ] }, { kin: 1, gps: [ 3, 4 ] } ] );
            expect( res.body ).toEqual( [ 'done' ] );
          })
          .end( done );
        });

        it('should return 500 failure for error', function( done ) {
          findAllStations.reject( 'Test' );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 500 )
          .expect( 'Test' )
          .expect( 'Content-Type', /text/ )
          .expect(function( res ) {
            expect( models.station.findAll ).toHaveBeenCalled();
            expect( models.station.findAll ).toHaveBeenCalledWith();
          })
          .end( done );
        });
      });
    });

    describe('app/stationReport', function() {
      var route = '/protected/app/stationReport';

      describe('POST', function() {
        var createReport;
        var body = { report: true };

        beforeEach(function() {
          createReport = Q.defer();
          spyOn( models.station_report, 'create' ).andReturn( createReport.promise );
        });

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

    describe('app/sponsors', function() {
      var route = '/protected/app/sponsors';

      describe('GET', function() {
        var findAllSponsors;

        beforeEach(function() {
          findAllSponsors = Q.defer();
          spyOn( models.app_sponsor, 'findAll' ).andReturn( findAllSponsors.promise );
        });

        it('should be a defined route (not 404)', function( done ) {
          findAllSponsors.reject();
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( res.statusCode ).not.toBe( 404 );
          })
          .end( done );
        });

        it('should return current sponsors', function( done ) {
          var sponsors = [ 'I am a sponsor.' ];
          findAllSponsors.resolve( sponsors );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 200 )
          .expect( sponsors )
          .expect( 'Content-Type', /json/ )
          .expect(function( res ) {
            expect( models.app_sponsor.findAll ).toHaveBeenCalled();
            expect( models.app_sponsor.findAll ).toHaveBeenCalledWith( { where: { current: true }, order: [ 'order' ] } );
          })
          .end( done );
        });

        it('should return 500 failure for error', function( done ) {
          findAllSponsors.reject( 'Test' );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 500 )
          .expect( 'Test' )
          .expect( 'Content-Type', /text/ )
          .expect(function( res ) {
            expect( models.app_sponsor.findAll ).toHaveBeenCalled();
            expect( models.app_sponsor.findAll ).toHaveBeenCalledWith( { where: { current: true }, order: [ 'order' ] } );
          })
          .end( done );
        });
      });
    });
  });
};