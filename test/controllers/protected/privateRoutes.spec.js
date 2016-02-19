var supertest = require( 'supertest' );
var app = require( '../../../server.js' ).app;
supertest = supertest( app );
var stationTests = require( './station.protectedController.spec.js' );
var appTests = require( './app.protectedController.spec.js' );

describe('Private Routes - protected/', function() {
  var route = '/protected';

  it('all routes should be protected by a JWT', function( done ) {
    supertest.get( route )
    .expect( 401 )
    .end( done );
  });

  stationTests();
  appTests();
});