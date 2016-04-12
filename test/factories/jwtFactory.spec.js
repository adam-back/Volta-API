var Q = require( 'q' );
var config    = require( '../../config/config' ).development;
var rewire = require( 'rewire' );
var factory = rewire( '../../factories/jwtFactory.js' );
var models = require( '../../models' );

module.exports = function() {
  describe('jwtFactory.js', function() {
    describe('createToken', function() {
      var createToken = factory.createToken;
      var user, mockJwt, revert;

      beforeEach(function() {
        user = models.user.build();
      });

      afterEach(function() {
        if ( typeof revert === 'function' ) {
          revert();
        }
      });

      it('should be defined as a function', function() {
        expect( typeof createToken ).toBe( 'function' );
      });

      it('should return a promise', function() {
        expect( Q.isPromise( createToken( user, null ) ) ).toBe( true );
      });

      it('should sign a jwt with user info as payload, secret, options', function( done ) {
        user = models.user.build( { first_name: 'Adam' } );
        mockJwt = {
          sign: function( payload, secret, options, cb ) {
            expect( payload.first_name ).toBe( 'Adam' );
            expect( secret ).toBe( 'notsosecret' );
            expect( options ).toEqual( { issuer: 'seniorllama' } );
            cb( 'fake token' );
          }
        };
        revert = factory.__set__( 'jwt', mockJwt );
        createToken( user, null )
        .then(function( token ) {
          expect( token ).toBe( 'fake token' );
          done();
        })
        .catch(function( error ) {
          expect( error ).not.toBeDefined();
          done();
        });
      });

      it('should sign a jwt with an expiration', function( done ) {
        user = models.user.build( { first_name: 'Adam' } );
        mockJwt = {
          sign: function( payload, secret, options, cb ) {
            expect( payload.first_name ).toBe( 'Adam' );
            expect( secret ).toBe( 'notsosecret' );
            expect( options ).toEqual( { issuer: 'seniorllama', expiresInMinutes: 5 } );
            cb( 'fake token' );
          }
        };
        revert = factory.__set__( 'jwt', mockJwt );
        createToken( user, 5 )
        .then(function( token ) {
          expect( token ).toBe( 'fake token' );
          done();
        })
        .catch(function( error ) {
          expect( error ).not.toBeDefined();
          done();
        });
      });
    });
  });
};