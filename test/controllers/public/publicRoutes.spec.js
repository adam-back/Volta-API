var stationTests = require( './station.controller.spec.js' );
var plugTests = require( './plug.controller.spec.js' );

describe('Public Routes', function() {
  stationTests();
  plugTests();
});