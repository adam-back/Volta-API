var appSponsorFactoryTests = require( './appSponsorFactory.spec.js' );
var csvFactoryTests = require( './csvFactory.spec.js' );
var ekmFactoryTests = require( './ekmFactory.spec.js' );
var reportHelpersTests = require( './reportHelpers.spec.js' );
var eventsOverTimeTests = require( './reports/eventsOverTime.spec.js' );
var kwhGrowthOverTimeTests = require( './reports/kwhGrowthOverTime.spec.js' );;

describe('Factories', function() {
  describe('REPORT HELPERS', function() {
    reportHelpersTests();
    eventsOverTimeTests();
    kwhGrowthOverTimeTests();
  });

  describe('MISC', function() {
    appSponsorFactoryTests();
    csvFactoryTests();
    ekmFactoryTests();
  });
});