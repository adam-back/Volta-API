var stationTests = require( './station.protectedController.spec.js' );
var appTests = require( './app.protectedController.spec.js' );

describe('Private Routes - protected/', function() {
  stationTests();
  appTests();
});