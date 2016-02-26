var Q = require( 'q' );
var env = process.env.NODE_ENV || 'development';
var config = require( '../../config/config' )[ env ];
var rewire = require( 'rewire' );
var factory = rewire( '../../factories/ekmFactory.js' );

module.exports = function() {
  describe('ekmFactory.js', function() {
    describe('makeMeterUrl', function() {
      var makeMeterUrl = factory.makeMeterUrl;

      it('should be defined as a function', function() {
        expect( typeof makeMeterUrl ).toBe( 'function' );
      });

      it('should return a string', function() {
        expect( typeof makeMeterUrl( '16021' ) ).toBe( 'string' );
      });

      it('should return url for v3', function() {
        var url = 'http://io.ekmpush.com/readMeter/v3/key/' + config.ekmApiKey + '/count/10/format/html/meters/16021';
        expect( makeMeterUrl( '16021' ) ).toBe( url );
      });

      it('should return a url for v4', function() {
        var url = 'http://io.ekmpush.com/readMeter/v4/key/' + config.ekmApiKey + '/count/10/format/html/meters/300000107';
        expect( makeMeterUrl( '300000107' ) ).toBe( url );
      });
    });

    describe('isJSONParsable', function() {
      var isJSONParsable = factory.isJSONParsable;

      it('should be defined as a function', function() {
        expect( typeof isJSONParsable ).toBe( 'function' );
      });

      it('should return a boolean', function() {
        expect( typeof isJSONParsable() ).toBe( 'boolean' );
      });

      it('should return true if input can be parsed', function() {
        var parsable = JSON.stringify( { test: [ true, 0 ] } );
        spyOn( JSON, 'parse' ).andCallThrough();
        var result = isJSONParsable( parsable );
        expect( result ).toBe( true );
        expect( JSON.parse ).toHaveBeenCalled();
      });

      it('should return false if input can\'t be parsed', function() {
        var result = isJSONParsable( '<html>' );
        expect( result ).toBe( false );
      });
    });

    describe('makeGetRequestToApi', function() {
      var makeGetRequestToApi = factory.makeGetRequestToApi;
      var readData = { x: 5, y: 6, readMeter: true };
      var response = JSON.stringify( readData );
      var mockUrl = 'https://www.google.com/';
      var revert;

      beforeEach(function() {
        revert = null;
      });

      afterEach(function() {
        if ( typeof revert === 'function' ) {
          revert();
        }
      });

      it('should be defined as a function', function() {
        expect( typeof makeGetRequestToApi ).toBe( 'function' );
      });

      it('should respond with parsed data', function( done ) {
        var mockHttp = {
          request: function( url, cb ) {
            expect( url ).toBe( mockUrl );
            cb( null, null, response );
          }
        };
        revert = factory.__set__( 'http', mockHttp );
        spyOn( factory, 'isJSONParsable' ).andCallThrough();
        spyOn( JSON, 'parse' ).andCallThrough();
        makeGetRequestToApi( mockUrl )
        .then(function( dataResponse ) {
          expect( factory.isJSONParsable ).toHaveBeenCalled();
          expect( factory.isJSONParsable ).toHaveBeenCalledWith( response );
          expect( JSON.parse ).toHaveBeenCalled();
          expect( JSON.parse ).toHaveBeenCalledWith( response );
          expect( dataResponse ).toEqual( JSON.parse( response ) );
          done();
        })
        .catch(function( error ) {
          expect( error ).toBe( 1 );
          done();
        });
      });

      it('should reject with the error if request throws', function( done ) {
        var mockHttp = {
          request: function( url, cb ) {
            cb( 'ENOTFOUND', null, null );
          }
        };

        revert = factory.__set__( 'http', mockHttp );
        makeGetRequestToApi( 'ooblygoobly' )
        .catch(function( error ) {
          expect( error ).toBe( 'ENOTFOUND' );
          done();
        });
      });

      it('should reject with an error if not parsable', function( done ) {
        var mockHttp = {
          request: function( url, cb ) {
            cb( null, null, {} );
          }
        };

        revert = factory.__set__( 'http', mockHttp );
        makeGetRequestToApi( mockUrl )
        .catch(function( error ) {
          expect( error ).toEqual( 'API error' );
          done();
        });
      });

      it('should reject with an error if no data', function( done ) {
        response = JSON.parse( response );
        delete response.readMeter;
        response = JSON.stringify( response );
        var mockHttp = {
          request: function( url, cb ) {
            cb( null, null, response );
          }
        };

        revert = factory.__set__( 'http', mockHttp );
        makeGetRequestToApi( mockUrl )
        .catch(function( error ) {
          expect( error ).toEqual( 'insufficient data' );
          done();
        });
      });
    });
  });
};