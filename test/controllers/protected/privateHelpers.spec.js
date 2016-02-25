var supertest = require( 'supertest' );
var app = require( '../../../server.js' ).app;
supertest = supertest( app );
var appHelperTests = require( './routeHelpers/app.protectedControllerHelpers.spec.js' );
var appUsersHelperTests = require( './routeHelpers/appUsers.protectedControllerHelpers.spec.js' );

describe('Private Route Helpers', function() {
  describe('APP HELPERS', function() {
    appHelperTests();
    appUsersHelperTests();
  });
});