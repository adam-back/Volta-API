var config    = require( '../../../../config/config' ).development;
var Q = require( 'q' );
var rewire = require( 'rewire' );
var models = require( '../../../../models' );
var controller = rewire( '../../../../controllers/protected/appUsers.protectedController.js' );
var bcrypt = require( 'bcrypt-nodejs' );
var createToken = require( '../../../jwtHelper' ).createToken;
var token = createToken();

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
        revert = controller.__set__( 'Q', mockQ );

        var result = saltAndHashPassword( 'password' );
        expect( Q.isPromise( result ) ).toBe( true );
      });

      it('should bind and denodify bcrypt.genSalt and bcrypt.hash', function() {
        this.addMatchers({
          toEqualThisOrThat: function( expectation1, expectation2 ) {
            var pass = false;

            if ( this.actual === expectation1 || this.actual === expectation2 ) {
              pass = true;
              this.message = 'Expected ' + this.actual + ' NOT to match ' + expectation1 + ' or ' + expectation2 ;
            } else {
              this.message = 'Expected ' + this.actual + ' to match ' + expectation1 + ' or ' + expectation2 ;
            }

            return pass;
          }
        });

        var hash = Q.defer();
        var mockQ = {
          nbind: function( fn, obj ) {
            expect( fn ).toEqualThisOrThat( bcrypt.hash, bcrypt.genSalt );
            expect( obj ).toEqual( bcrypt );
            return function() {
              return hash.promise;
            };
          }
        };

        revert = controller.__set__( 'Q', mockQ );
        saltAndHashPassword( 'password' );
      });

      it('should salt and hash a password', function( done ) {
        saltAndHashPassword( 'password' )
        .then(function( saltAndHash ) {
          expect( saltAndHash ).toBeDefined();
          expect( typeof saltAndHash ).toBe( 'string' );
          bcrypt.compare( 'password', saltAndHash, function( err, res ) {
            if ( err ) {
              throw err;
            } else {
              expect( res ).toBe( true );
            }
          });
        })
        .catch(function( error ) {
          expect( error ).toBeUndefined();
        })
        .done( done );
      });
    });

    describe('comparePasswordToDatabase', function() {
      var comparePasswordToDatabase = controller.comparePasswordToDatabase;
      var mockBcrypt, revert;

      afterEach(function() {
        if ( typeof revert === 'function' ) {
          revert();
        }
      });

      it('should be defined as a function', function() {
        expect( typeof comparePasswordToDatabase ).toBe( 'function' );
      });

      it('should bind and denodify bcrypt.compare', function() {
        var mockQ = {
          nbind: function( fn, obj ) {
            expect( fn ).toEqual( bcrypt.compare );
            expect( obj ).toEqual( bcrypt );
            return function() {
              return void( 0 );
            };
          }
        };

        revert = controller.__set__( 'Q', mockQ );
        comparePasswordToDatabase( 'password', null );
      });

      it('should return a promise', function() {
        var compare = Q.defer();
        var mockQ = {
          nbind: function( fn, obj ) {
            return function() {
              return compare.promise;
            };
          }
        };
        spyOn( mockQ, 'nbind' ).andCallThrough();
        revert = controller.__set__( 'Q', mockQ );

        var result = comparePasswordToDatabase( 'password', null );
        expect( Q.isPromise( result ) ).toBe( true );
      });

      it('should receive plaintext password as param 1 and DB hash as param 2', function() {
        var compare = Q.defer();
        var mockQ = {
          nbind: function( fn, obj ) {
            return function( plaintext, hash) {
              expect( plaintext ).toBe( 'password' );
              expect( hash ).toBe( '!@#' );
              return compare.promise;
            };
          }
        };
        spyOn( mockQ, 'nbind' ).andCallThrough();
        revert = controller.__set__( 'Q', mockQ );

        comparePasswordToDatabase( 'password', '!@#' );
      });

      it('should return boolean after comparing password and saltHash from DB', function( done ) {
        controller.saltAndHashPassword( 'password' )
        .then(function( hashed ) {
          return comparePasswordToDatabase( 'password', hashed );
        })
        .then(function( result ) {
          expect( result ).toBeDefined();
          expect( typeof result ).toBe( 'boolean' );
        })
        .catch(function( error ) {
          expect( error ).toBeUndefined();
        })
        .done( done );
      });

      it('should return true for matching password', function( done ) {
        controller.saltAndHashPassword( 'password' )
        .then(function( hashed ) {
          return comparePasswordToDatabase( 'password', hashed );
        })
        .then(function( result ) {
          expect( result ).toBe( true );
        })
        .catch(function( error ) {
          expect( error ).toBeUndefined();
        })
        .done( done );
      });

      it('should return false for wrong password', function( done ) {
        controller.saltAndHashPassword( 'ABC' )
        .then(function( hashed ) {
          return comparePasswordToDatabase( 'password', hashed );
        })
        .then(function( result ) {
          expect( result ).toBe( false );
        })
        .catch(function( error ) {
          expect( error ).toBeUndefined();
        })
        .done( done );
      });
    });
  });
};