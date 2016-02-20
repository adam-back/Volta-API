var supertest = require( 'supertest' );
var app = require( '../../../server.js' ).app;
supertest = supertest( app );
var appHelperTests = require( './routeHelpers/app.protectedControllerHelpers.spec.js' );

describe('Private Route Helpers', function() {
  appHelperTests();
});