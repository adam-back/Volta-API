var supertest = require( 'supertest' );
var app = require( '../../../../server.js' ).app;
supertest = supertest( app );
var config    = require( '../../../../config/config' ).development;
var Q = require( 'q' );
var async     = require( 'async' );
var models = require( '../../../../models' );
var controller = require( '../../../../controllers/protected/app.protectedController.js' );
var geocodeCache = require( '../../../../factories/geocodeCache.js' ).geocodeCache;
var calculateDistance = require( '../../../../factories/distanceFactory.js' ).getDistanceFromLatLonInMiles;
var createToken = require( '../../../jwtHelper' ).createToken;
var token = createToken( 5 );
var geocoder = require( 'node-geocoder' )( 'google', 'https', { apiKey: config.googleApiKey, formatter: null } );

module.exports = function() {
  describe('APP ROUTES', function() {
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
          spyOn( controller, 'connectStationsWithPlugsAndSponsors' ).andReturn( connectStations.promise );
          spyOn( models.user, 'find' ).andReturn( findUser.promise );
          spyOn( controller, 'groupByKin' ).andReturn( groupIntoKins.promise );
          spyOn( controller, 'attachImages' ).andReturn( addGalleryImages.promise );
          spyOn( controller, 'geocodeGroupsWithoutGPS' ).andReturn( geocodeIfNeeded.promise );
          spyOn( controller, 'findDistances' );
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