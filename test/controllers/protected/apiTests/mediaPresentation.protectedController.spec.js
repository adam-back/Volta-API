var request = require( 'request' );
var models = require( '../../../../models' );
var async = require( 'async' );
var supertest = require( 'supertest' );
var app = require( '../../../../server.js' ).app;
supertest = supertest( app );
var Q = require( 'q' );
var createToken = require( '../../../jwtHelper' ).createToken;
var token = createToken( 5 );

module.exports = function() {
  describe('PRESENTATIONS', function() {
    describe('mediaPresentation/', function() {
      describe('GET', function() {
      });

      describe('POST', function() {
      });
    });

    describe('mediaPresentation/:id', function() {
      describe('GET', function() {
      });

      describe('DELETE', function() {
      });
    });
  });
};