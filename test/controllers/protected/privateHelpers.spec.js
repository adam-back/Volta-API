var supertest = require( 'supertest' );
var app = require( '../../../server.js' ).app;
supertest = supertest( app );
var appUsersHelperTests = require( './routeHelpers/appUsers.protectedControllerHelpers.spec.js' );

describe('Private Route Helpers', function() {
  describe('APP HELPERS', function() {
    appUsersHelperTests();
  });
});