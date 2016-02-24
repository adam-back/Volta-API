var supertest = require( 'supertest' );
var app = require( '../../../../server.js' ).app;
supertest = supertest( app );
var config    = require( '../../../../config/config' ).development;
var Q = require( 'q' );
var async     = require( 'async' );
var models = require( '../../../../models' );
var controller = require( '../../../../controllers/protected/appFavorites.protectedController.js' );
var geocodeCache = require( '../../../../factories/geocodeCache.js' ).geocodeCache;
var calculateDistance = require( '../../../../factories/distanceFactory.js' ).getDistanceFromLatLonInMiles;
var createToken = require( '../../../jwtHelper' ).createToken;
var token = createToken( 5 );
var geocoder = require( 'node-geocoder' )( 'google', 'https', { apiKey: config.googleApiKey, formatter: null } );

module.exports = function() {
  describe('APP FAVORITES ROUTES', function() {
    describe('app/favorites', function() {
      var route = '/protected/app/favorites';

      describe('POST', function() {
        var body, findAllStations, findUser, User, updateUser;

        beforeEach(function() {
          body = {
            userId: 5,
            group: [ 1, 2 ]
          };
          findAllStations = Q.defer();
          findUser = Q.defer();
          updateUser = Q.defer();
          User = models.user.build( { favorite_stations: [ 3, 4 ] } );

          spyOn( models.station, 'findAll' ).andReturn( findAllStations.promise );
          spyOn( models.user, 'find' ).andReturn( findUser.promise );
          spyOn( User, 'updateAttributes' ).andReturn( updateUser.promise );
        });

        it('should be a defined route (not 404)', function( done ) {
          findAllStations.reject();
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect(function( res ) {
            expect( res.statusCode ).not.toBe( 404 );
          })
          .end( done );
        });

        it('should find all stations', function( done ) {
          findAllStations.reject();
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect(function( res ) {
            expect( models.station.findAll ).toHaveBeenCalled();
            expect( models.station.findAll ).toHaveBeenCalledWith( { where: { id: { $in: [ 1, 2 ] } } } );
          })
          .end( done );
        });

        it('find the user', function( done ) {
          findAllStations.resolve();
          findUser.reject();
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect(function( res ) {
            expect( models.user.find ).toHaveBeenCalled();
            expect( models.user.find ).toHaveBeenCalledWith( { where: { id: 5 } } );
          })
          .end( done );
        });

        it('should update user\'s favorite stations', function( done ) {
          findAllStations.resolve( [ { id: 1 }, { id: 2 } ] );
          findUser.resolve( User );
          updateUser.reject();
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect(function( res ) {
            expect( User.updateAttributes ).toHaveBeenCalled();
            expect( User.updateAttributes ).toHaveBeenCalledWith( { 'favorite_stations': [ 3, 4, 1, 2 ] } );
          })
          .end( done );
        });

        it('should update user\'s favorite station if they didn\'t have faves yet', function( done ) {
          findAllStations.resolve( [ { id: 1 }, { id: 2 } ] );
          User.favorite_stations = null;
          findUser.resolve( User );
          updateUser.reject();
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect(function( res ) {
            expect( User.updateAttributes ).toHaveBeenCalled();
            expect( User.updateAttributes ).toHaveBeenCalledWith( { 'favorite_stations': [ 1, 2 ] } );
          })
          .end( done );
        });

        it('should send blank 200 when done', function( done ) {
          findAllStations.resolve( [ { id: 1 }, { id: 2 } ] );
          User.favorite_stations = null;
          findUser.resolve( User );
          updateUser.resolve();
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect( 200 )
          .expect( '' )
          .end( done );
        });

        it('should return 500 failure for error', function( done ) {
          findAllStations.reject( 'Test' );
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect( 500 )
          .expect( 'Test' )
          .expect( 'Content-Type', /text/ )
          .expect(function( res ) {
            expect( models.station.findAll ).toHaveBeenCalled();
          })
          .end( done );
        });
      });
    });
  });
};