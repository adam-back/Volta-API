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
var token = createToken();

module.exports = function() {
  describe('APP', function() {
    describe('app/stations', function() {
      var route = '/protected/app/stations';

      describe('GET', function() {
        var formatStations;

        beforeEach(function() {
          formatStations = Q.defer();
          spyOn( appFactory, 'formatStationsForApp' ).andReturn( formatStations.promise );
        });

        afterEach(function() {
          route = '/protected/app/stations';
        });

        it('should be a defined route (not 404)', function( done ) {
          formatStations.reject( new Error( 'Test' ) );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( res.statusCode ).not.toBe( 404 );
          })
          .end( done );
        });

        it('should call appFactory.formatStationsForApp', function( done ) {
          formatStations.reject( new Error( 'Test' ) );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( appFactory.formatStationsForApp ).toHaveBeenCalled();
          })
          .end( done );
        });

        it('should call factory for every station', function( done ) {
          formatStations.reject( new Error( 'Test' ) );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( appFactory.formatStationsForApp.calls[ 0 ].args[ 0 ] ).toBe( null );
          })
          .end( done );
        });

        it('should call factory with user id and coords', function( done ) {
          formatStations.reject( new Error( 'Test' ) );
          route += '?id=1';
          route += '&userCoords[]=5&userCoords[]=6';
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( appFactory.formatStationsForApp.calls[ 0 ].args[ 1 ] ).toEqual( '1' );
            expect( appFactory.formatStationsForApp.calls[ 0 ].args[ 2 ] ).toEqual( [ '5', '6' ] );
          })
          .end( done );
        });

        it('should return json of formatted stations', function( done ) {
          formatStations.resolve( [ 'done' ] );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 200 )
          .expect( 'Content-Type', /json/ )
          .expect( [ 'done' ] )
          .end( done );
        });

        it('should return 500 failure for error', function( done ) {
          formatStations.reject( new Error( 'Test' ) );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 500 )
          .expect( 'Test' )
          .expect( 'Content-Type', /text/ )
          .expect(function( res ) {
            expect( appFactory.formatStationsForApp ).toHaveBeenCalled();
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
          createReport.reject( new Error( 'Test' ) );
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
          createReport.reject( new Error( 'Test' ) );
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
          findAllSponsors.reject( new Error( 'Test' ) );
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
          findAllSponsors.reject( new Error( 'Test' ) );
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