var appSponsorFactoryTests = require( './appSponsorFactory.spec.js' );
var appFactoryTests = require( './appFactory.spec.js' );
var csvFactoryTests = require( './csvFactory.spec.js' );
var distanceFactoryTests = require( './distanceFactory.spec.js' );
var ekmFactoryTests = require( './ekmFactory.spec.js' );
var jwtFactoryTests = require( './jwtFactory.spec.js' );
var geocodeCacheTests = require( './geocodeCache.spec.js' );
var reportHelpersTests = require( './reportHelpers.spec.js' );
var eventsOverTimeTests = require( './reports/eventsOverTime.spec.js' );
var kwhGrowthOverTimeTests = require( './reports/kwhGrowthOverTime.spec.js' );
var mediaScheduleFactoryTests = require( './media/mediaScheduleFactory.spec.js' );

describe('Factories', function() {
  describe('REPORT HELPERS', function() {
    reportHelpersTests();
    eventsOverTimeTests();
    kwhGrowthOverTimeTests();
  });

  describe('APP HELPERS', function() {
    appFactoryTests();
    geocodeCacheTests();
    appSponsorFactoryTests();
  });

  describe('MEDIA HELPERS', function() {
    mediaScheduleFactoryTests();
  });

  describe('MISC', function() {
    csvFactoryTests();
    ekmFactoryTests();
    distanceFactoryTests();
    jwtFactoryTests();
  });

});