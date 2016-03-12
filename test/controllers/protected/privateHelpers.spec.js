var supertest = require( 'supertest' );
var app = require( '../../../server.js' ).app;
supertest = supertest( app );
var appUsersHelperTests = require( './routeHelpers/appUsers.protectedControllerHelpers.spec.js' );
var d3HelperTests = require( './routeHelpers/d3.protectedControllerHelpers.spec.js' );
var presentationHelperTests = require( './routeHelpers/mediaPresentation.protectedControllerHelpers.spec.js' );
var reportHelperTests = require( './routeHelpers/reports.protectedControllerHelpers.spec.js' );

describe('Private Route Helpers', function() {
  describe('REPORT HELPERS', function() {
    reportHelperTests();
  });

  describe('APP HELPERS', function() {
    appUsersHelperTests();
  });

  describe('D3 HELPERS', function() {
    d3HelperTests();
  });

  describe('MEDIA HELPERS', function() {
    presentationHelperTests();
  });
});