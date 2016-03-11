var supertest = require( 'supertest' );
var app = require( '../../../../server.js' ).app;
supertest = supertest( app );
var config = require( '../../../../config/config' ).development;
var jwtFactory = require( '../../../../factories/jwtFactory' );
var Q = require( 'q' );
var models = require( '../../../../models' );
var controller = require( '../../../../controllers/protected/appUsers.protectedController.js' );

var createToken = require( '../../../jwtHelper' ).createToken;
var token = createToken();


module.exports = function() {
  describe('USERS', function() {
    describe('app/user/create', function() {
      var route = '/protected/app/user/create';

      describe('POST', function() {
        var body, hashPw, findUser, createUser, newJWT;

        beforeEach(function() {
          body = {
            email: 'a@gmail.com',
            password1: 'password'
          };
          findUser = Q.defer();
          createUser = Q.defer();
          hashPw = Q.defer();
          newJWT = Q.defer();
          spyOn( models.user, 'findOne' ).andReturn( findUser.promise );
          spyOn( controller, 'saltAndHashPassword' ).andReturn( hashPw.promise );
          spyOn( models.user, 'create' ).andReturn( createUser.promise );
          spyOn( jwtFactory, 'createToken' ).andReturn( newJWT.promise );
        });

        it('should be a defined route (not 404)', function( done ) {
          findUser.reject( 'Test' );
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect(function( res ) {
            expect( res.statusCode ).not.toBe( 404 );
          })
          .end( done );
        });

        it('should search for user by email', function( done ) {
          findUser.reject( 'Test' );
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect(function( res ) {
            expect( models.user.findOne ).toHaveBeenCalled();
            expect( models.user.findOne ).toHaveBeenCalledWith( { where: { email: 'a@gmail.com' } } );
          })
          .end( done );
        });

        it('should force email to lowercase', function( done ) {
          body.email = 'A@gmail.com';
          findUser.reject( 'Test' );
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect(function( res ) {
            expect( models.user.findOne ).toHaveBeenCalled();
            expect( models.user.findOne ).toHaveBeenCalledWith( { where: { email: 'a@gmail.com' } } );
          })
          .end( done );
        });

        it('should reject with 409 if user is already registered', function( done ) {
          findUser.resolve( { id: 1 } );
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect( 409 )
          .expect( 'Content-Type', /text/ )
          .expect( 'This email address is already registered with Volta.' )
          .expect(function( res ) {
            expect( models.user.create ).not.toHaveBeenCalled();
          })
          .end( done );
        });

        it('should hash and salt password', function( done ) {
          findUser.resolve();
          hashPw.reject( 'Test' );
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect(function( res ) {
            expect( controller.saltAndHashPassword ).toHaveBeenCalled();
            expect( controller.saltAndHashPassword ).toHaveBeenCalledWith( 'password' );
          })
          .end( done );
        });

        it('should create a user', function( done ) {
          findUser.resolve();
          hashPw.resolve( '%$!' );
          createUser.reject( 'Test' );
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect(function( res ) {
            expect( models.user.create ).toHaveBeenCalled();
            expect( models.user.create ).toHaveBeenCalledWith( { email: 'a@gmail.com', password: '%$!', is_new: true, number_of_app_uses: 1 } );
          })
          .end( done );
        });


        it('should issue JWT to user', function( done ) {
          findUser.resolve();
          hashPw.resolve( '%$!' );
          createUser.resolve( 'User' );
          newJWT.reject( 'Test' );
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect(function( res ) {
            expect( jwtFactory.createToken ).toHaveBeenCalled();
            expect( jwtFactory.createToken ).toHaveBeenCalledWith( 'User' );
          })
          .end( done );
        });

        it('should respond 201 with token', function( done ) {
          findUser.resolve();
          hashPw.resolve( '%$!' );
          createUser.resolve( 'User' );
          newJWT.resolve( 'JWT' );
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect( 201 )
          .expect( { token: 'JWT' } )
          .end( done );
        });

        it('should return 500 failure for error', function( done ) {
          findUser.reject( 'Test' );
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect( 500 )
          .expect( 'Test' )
          .expect( 'Content-Type', /text/ )
          .expect(function( res ) {
            expect( models.user.findOne ).toHaveBeenCalled();
          })
          .end( done );
        });
      });
    });

    describe('app/user/authenticate', function() {
      var route = '/protected/app/user/authenticate';

      describe('POST', function() {
        var body, findUser, comparePassword, makeToken;

        beforeEach(function() {
          body = {
            email: 'a@gmail.com',
            password: 'password'
          };
          findUser = Q.defer();
          comparePassword = Q.defer();
          makeToken = Q.defer();

          spyOn( models.user, 'findOne' ).andReturn( findUser.promise );
          spyOn( controller, 'comparePasswordToDatabase' ).andReturn( comparePassword.promise );
          spyOn( jwtFactory, 'createToken' ).andReturn( makeToken.promise );
        });

        it('should be a defined route (not 404)', function( done ) {
          findUser.reject( 'Test' );
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect(function( res ) {
            expect( res.statusCode ).not.toBe( 404 );
          })
          .end( done );
        });

        it('should search for user by email', function( done ) {
          findUser.reject( 'Test' );
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect(function( res ) {
            expect( models.user.findOne ).toHaveBeenCalled();
            expect( models.user.findOne ).toHaveBeenCalledWith( { where: { email: 'a@gmail.com' } } );
          })
          .end( done );
        });

        it('should force email to lowercase', function( done ) {
          body.email = 'A@gmail.com';
          findUser.reject( 'Test' );
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect(function( res ) {
            expect( models.user.findOne ).toHaveBeenCalled();
            expect( models.user.findOne ).toHaveBeenCalledWith( { where: { email: 'a@gmail.com' } } );
          })
          .end( done );
        });

        it('should 401 if email is not found', function( done ) {
          findUser.resolve( null );
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect( 401 )
          .expect( 'Content-Type', /text/ )
          .expect( 'Please check your email and password.' )
          .expect(function( res ) {
            expect( controller.comparePasswordToDatabase ).not.toHaveBeenCalled();
          })
          .end( done );
        });

        it('should check password if email on file', function( done ) {
          findUser.resolve( { password: 'ABC' } );
          comparePassword.reject( 'Test' );
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect(function( res ) {
            expect( controller.comparePasswordToDatabase ).toHaveBeenCalled();
            expect( controller.comparePasswordToDatabase ).toHaveBeenCalledWith( 'password', 'ABC' );
          })
          .end( done );
        });

        it('should 401 if password is wrong', function( done ) {
          findUser.resolve( { password: 'ABC' } );
          comparePassword.resolve( false );
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect( 401 )
          .expect( 'Content-Type', /text/ )
          .expect( 'Please check your email and password.' )
          .end( done );
        });

        it('should create token if passwords match', function( done ) {
          findUser.resolve( { id: 1, password: 'password' } );
          comparePassword.resolve( true );
          makeToken.reject( 'Test' );
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect(function( res ) {
            expect( jwtFactory.createToken ).toHaveBeenCalled();
            expect( jwtFactory.createToken ).toHaveBeenCalledWith( { id: 1, password: 'password' } );
          })
          .end( done );
        });

        it('should respond 200 with token on successful auth', function( done ) {
          findUser.resolve( { id: 1, password: 'password' } );
          comparePassword.resolve( true );
          makeToken.resolve( 'Token' );
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect( 200 )
          .expect( { token: 'Token' } )
          .end( done );
        });

        it('should return 500 failure for error', function( done ) {
          findUser.reject( 'Test' );
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect( 500 )
          .expect( 'Test' )
          .expect( 'Content-Type', /text/ )
          .expect(function( res ) {
            expect( models.user.findOne ).toHaveBeenCalled();
          })
          .end( done );
        });
      });
    });

    describe('app/user/resetPassword', function() {
      var route = '/protected/app/user/resetPassword';

      describe('POST', function() {
        var body, findUser;

        beforeEach(function() {
          body = {
            email: 'a@gmail.com'
          };
          findUser = Q.defer();
          spyOn( models.user, 'findOne' ).andReturn( findUser.promise );
        });

        it('should be a defined route (not 404)', function( done ) {
          findUser.reject( 'Test' );
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect(function( res ) {
            expect( res.statusCode ).not.toBe( 404 );
          })
          .end( done );
        });

        it('search search for user by email', function( done ) {
          findUser.reject( 'Test' );
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect(function( res ) {
            expect( models.user.findOne ).toHaveBeenCalled();
            expect( models.user.findOne ).toHaveBeenCalledWith( { where: { email: 'a@gmail.com' } } );
          })
          .end( done );
        });

        it('should force email to lowercase', function( done ) {
          body.email = 'A@gmail.com';
          findUser.reject( 'Test' );
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect(function( res ) {
            expect( models.user.findOne ).toHaveBeenCalled();
            expect( models.user.findOne ).toHaveBeenCalledWith( { where: { email: 'a@gmail.com' } } );
          })
          .end( done );
        });

        it('should return the user if found', function( done ) {
          findUser.resolve( { id: 1, email: 'adam@gmail.com' } );
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect( 200 )
          .expect( { user: { id: 1, email_address: 'adam@gmail.com' } } )
          .end( done );
        });

        it('should return blank 200 if no user found', function( done ) {
          findUser.resolve( null );
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect( 200 )
          .expect( '' )
          .end( done );
        });

        it('should return 500 failure for error', function( done ) {
          findUser.reject( 'Test' );
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect( 500 )
          .expect( 'Test' )
          .expect( 'Content-Type', /text/ )
          .expect(function( res ) {
            expect( models.user.findOne ).toHaveBeenCalled();
          })
          .end( done );
        });
      });

      describe('PATCH', function() {
        var body, findUser, foundUser, createNewPw, saveUser;

        beforeEach(function() {
          body = {
            user: {
              id: 1,
              email_address: 'a@gmail.com',
              password: 'newpw'
            }
          };
          foundUser = models.user.build( { id: 1, email_addresss: 'a@gmail.com', password: 'password' } );
          findUser = Q.defer();
          createNewPw = Q.defer();
          saveUser = Q.defer();

          spyOn( models.user, 'findOne' ).andReturn( findUser.promise );
          spyOn( controller, 'saltAndHashPassword' ).andReturn( createNewPw.promise );
          spyOn( foundUser, 'save' ).andReturn( saveUser.promise );
        });

        it('should be a defined route (not 404)', function( done ) {
          findUser.reject( 'Test' );
          supertest.patch( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect(function( res ) {
            expect( res.statusCode ).not.toBe( 404 );
          })
          .end( done );
        });

        it('should search for user by email', function( done ) {
          findUser.reject( 'Test' );
          supertest.patch( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect(function( res ) {
            expect( models.user.findOne ).toHaveBeenCalled();
            expect( models.user.findOne ).toHaveBeenCalledWith( { where: { id: 1, email: 'a@gmail.com' } } );
          })
          .end( done );
        });

        it('should return 500 if no user found', function( done ) {
          findUser.resolve( null );
          supertest.patch( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect( 500 )
          .expect( 'No user found.' )
          .end( done );
        });

        it('should salt and hash new password', function( done ) {
          findUser.resolve( foundUser );
          createNewPw.reject( 'Test' );
          supertest.patch( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect(function( res ) {
            expect( controller.saltAndHashPassword ).toHaveBeenCalled();
            expect( controller.saltAndHashPassword ).toHaveBeenCalledWith( 'newpw' );
          })
          .end( done );
        });

        it('should update user\'s password in DB', function( done ) {
          findUser.resolve( foundUser );
          createNewPw.resolve( 'hashed password' );
          saveUser.reject( 'Test' );
          supertest.patch( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect(function( res ) {
            expect( foundUser.save ).toHaveBeenCalled();
            expect( foundUser.save ).toHaveBeenCalledWith();
          })
          .end( done );
        });

        it('should return blank 200 on success', function( done ) {
          findUser.resolve( foundUser );
          createNewPw.resolve( 'hashed password' );
          saveUser.resolve();
          supertest.patch( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect( 200 )
          .expect( '' )
          .end( done );
        });

        it('should return 500 failure for error', function( done ) {
          findUser.reject( 'Test' );
          supertest.patch( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect( 500 )
          .expect( 'Test' )
          .expect( 'Content-Type', /text/ )
          .expect(function( res ) {
            expect( models.user.findOne ).toHaveBeenCalled();
          })
          .end( done );
        });
      });
    });
  });
};