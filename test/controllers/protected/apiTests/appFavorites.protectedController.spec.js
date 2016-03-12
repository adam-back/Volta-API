var supertest = require( 'supertest' );
var app = require( '../../../../server.js' ).app;
supertest = supertest( app );

var Q = require( 'q' );
var models = require( '../../../../models' );
var controller = require( '../../../../controllers/protected/appFavorites.protectedController.js' );
var appFactory = require( '../../../../factories/appFactory.js' );
var createToken = require( '../../../jwtHelper' ).createToken;
var token = createToken();

module.exports = function() {
  describe('FAVORITES', function() {
    describe('app/favorites', function() {
      var route = '/protected/app/favorites';

      describe('GET', function() {
        var findUser, formatStations;

        beforeEach(function() {
          findUser = Q.defer();
          formatStations = Q.defer();
          spyOn( models.user, 'findOne' ).andReturn( findUser.promise );
          spyOn( appFactory, 'formatStationsForApp' ).andReturn( formatStations.promise );
          route += '?id=1';
        });

        afterEach(function() {
          route = '/protected/app/favorites';
        });

        it('should be a defined route (not 404)', function( done ) {
          findUser.reject( new Error( 'Test' ) );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( res.statusCode ).not.toBe( 404 );
          })
          .end( done );
        });

        it('should find one user', function( done ) {
          findUser.reject( new Error( 'Test' ) );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( models.user.findOne ).toHaveBeenCalled();
            expect( models.user.findOne ).toHaveBeenCalledWith( { where: { id: '1' } }  );
          })
          .end( done );
        });

        it('should send send empty JSON if user has no favorites', function( done ) {
          findUser.resolve( { favorite_stations: [] } );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 200 )
          .expect( 'Content-Type', /json/ )
          .expect( [] )
          .expect(function( res ) {
            expect( appFactory.formatStationsForApp ).not.toHaveBeenCalled();
          })
          .end( done );
        });

        it('should format favorites for app', function( done ) {
          findUser.resolve( { id: 42, favorite_stations: [ 1, 2 ] } );
          formatStations.reject( new Error( 'Test' ) );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( appFactory.formatStationsForApp ).toHaveBeenCalled();
            expect( appFactory.formatStationsForApp ).toHaveBeenCalledWith( { where: { id: { $in: [ 1, 2 ] } } }, 42, undefined );
          })
          .end( done );
        });

        it('should call formatStationsForApp with WHERE clause', function( done ) {
          findUser.resolve( { id: 42, favorite_stations: [ 1, 2 ] } );
          formatStations.reject( new Error( 'Test' ) );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( appFactory.formatStationsForApp ).toHaveBeenCalled();
            expect( appFactory.formatStationsForApp.calls[ 0 ].args[ 0 ] ).toEqual( { where: { id: { $in: [ 1, 2 ] } } } );
          })
          .end( done );
        });

        it('should call formatStationsForApp with user id', function( done ) {
          findUser.resolve( { id: 42, favorite_stations: [ 1, 2 ] } );
          formatStations.reject( new Error( 'Test' ) );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( appFactory.formatStationsForApp ).toHaveBeenCalled();
            expect( appFactory.formatStationsForApp.calls[ 0 ].args[ 1 ] ).toBe( 42 );
          })
          .end( done );
        });

        it('should call formatStationsForApp with user coords', function( done ) {
          findUser.resolve( { id: 42, favorite_stations: [ 1, 2 ] } );
          route += '&userCoords[]=5&userCoords[]=6';
          formatStations.reject( new Error( 'Test' ) );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( appFactory.formatStationsForApp ).toHaveBeenCalled();
            expect( appFactory.formatStationsForApp.calls[ 0 ].args[ 2 ] ).toEqual( [ '5', '6' ] );
          })
          .end( done );
        });

        it('should send 500 if no id sent as querystring', function( done ) {
          route = '/protected/app/favorites';
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 500 )
          .expect( 'No user id sent.' )
          .expect(function( res ) {
            expect( models.user.findOne ).not.toHaveBeenCalled();
          })
          .end( done );
        });
      });

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
          findAllStations.reject( new Error( 'Test' ) );
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect(function( res ) {
            expect( res.statusCode ).not.toBe( 404 );
          })
          .end( done );
        });

        it('should find all stations', function( done ) {
          findAllStations.reject( new Error( 'Test' ) );
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
          findUser.reject( new Error( 'Test' ) );
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
          updateUser.reject( new Error( 'Test' ) );
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
          updateUser.reject( new Error( 'Test' ) );
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
          findAllStations.reject( new Error( 'Test' ) );
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

      describe('PATCH', function() {
        var body, findUser, User, updateUser;

        beforeEach(function() {
          body = {
            userId: 5,
            group: [ 1, 3 ]
          };
          findUser = Q.defer();
          updateUser = Q.defer();
          User = models.user.build( { favorite_stations: [ 1, 2, 3, 4 ] } );

          spyOn( models.user, 'find' ).andReturn( findUser.promise );
          spyOn( User, 'updateAttributes' ).andReturn( updateUser.promise );
        });

        it('should be a defined route (not 404)', function( done ) {
          findUser.reject( new Error( 'Test' ) );
          supertest.patch( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect(function( res ) {
            expect( res.statusCode ).not.toBe( 404 );
          })
          .end( done );
        });

        it('find the user', function( done ) {
          findUser.reject( new Error( 'Test' ) );
          supertest.patch( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect(function( res ) {
            expect( models.user.find ).toHaveBeenCalled();
            expect( models.user.find ).toHaveBeenCalledWith( { where: { id: 5 } } );
          })
          .end( done );
        });

        it('should remove stations from user\'s favorites and update DB', function( done ) {
          findUser.resolve( User );
          updateUser.reject( new Error( 'Test' ) );
          supertest.patch( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect(function( res ) {
            expect( User.updateAttributes ).toHaveBeenCalled();
            expect( User.updateAttributes ).toHaveBeenCalledWith( { 'favorite_stations': [ 2, 4 ] } );
          })
          .end( done );
        });

        it('should send blank 200 when done', function( done ) {
          User.favorite_stations = [];
          findUser.resolve( User );
          updateUser.resolve();
          supertest.patch( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect( 200 )
          .expect( '' )
          .end( done );
        });

        it('should return 500 failure for error', function( done ) {
          findUser.reject( new Error( 'Test' ) );
          supertest.patch( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect( 500 )
          .expect( 'Test' )
          .expect( 'Content-Type', /text/ )
          .expect(function( res ) {
            expect( models.user.find ).toHaveBeenCalled();
          })
          .end( done );
        });
      });
    });
  });
};