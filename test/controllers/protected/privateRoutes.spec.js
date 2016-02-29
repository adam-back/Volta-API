var supertest = require( 'supertest' );
var app = require( '../../../server.js' ).app;
supertest = supertest( app );
var stationTests = require( './apiTests/station.protectedController.spec.js' );
var appTests = require( './apiTests/app.protectedController.spec.js' );
var mediaSlideTests = require( './apiTests/mediaSlide.protectedController.spec.js' );
var appFavoritesTests = require( './apiTests/appFavorites.protectedController.spec.js' );
var appUsersTests = require( './apiTests/appUsers.protectedController.spec.js' );

describe('Private API Routes - protected/', function() {
  var route = '/protected';

  it('all routes should be protected by a JWT', function( done ) {
    supertest.get( route )
    .expect( 401 )
    .end( done );
  });

  stationTests();

  describe('APP ROUTES', function() {
    appTests();
    appFavoritesTests();
    appUsersTests();
  });

  mediaSlideTests();
});