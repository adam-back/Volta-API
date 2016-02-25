var config    = require( '../../../../config/config' ).development;
var Q = require( 'q' );
var rewire = require( 'rewire' );
var models = require( '../../../../models' );
var controller = rewire( '../../../../controllers/protected/appUsers.protectedController.js' );

var createToken = require( '../../../jwtHelper' ).createToken;
var token = createToken( 5 );

module.exports = function() {
  describe('USERS', function() {
    describe('saltAndHashPassword', function() {
      var saltAndHashPassword = controller.saltAndHashPassword;
      var mockBcrypt, revert;

      afterEach(function() {
        if ( typeof revert === 'function' ) {
          revert();
        }
      });

      it('should be defined as a function', function() {
        expect( typeof saltAndHashPassword ).toBe( 'function' );
      });

      it('should denodify bcrypt.hash', function() {
        var mockQ = {
          nbind: function( fn, obj ) {
            return void( 0 );
          }
        };

        spyOn( mockQ, 'nbind' ).andReturn(function( pw, num ) {
          return [ pw, num ];
        });
        var revert = controller.__set__( 'Q', mockQ );

        saltAndHashPassword( 'password' );
        expect( mockQ.nbind ).toHaveBeenCalled();
        revert();
      });

      it('should return a promise', function() {
        var hash = Q.defer();
        var mockQ = {
          nbind: function( fn, obj ) {
            return function() {
              return hash.promise;
            };
          }
        };
        spyOn( mockQ, 'nbind' ).andCallThrough();
        var revert = controller.__set__( 'Q', mockQ );

        var result = saltAndHashPassword( 'password' );
        expect( Q.isPromise( result ) ).toBe( true );
        revert();
      });
    });
  });
};