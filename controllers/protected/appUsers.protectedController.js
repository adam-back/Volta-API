var user = require( '../../models' ).user;
var Q = require( 'q' );
var env = process.env.NODE_ENV || 'development';
var config    = require( '../../config/config' )[ env ];
var bcrypt = require( 'bcrypt' );
var jwtFactory = require( '../../factories/jwtFactory' );

module.exports = exports = {
  saltAndHashPassword: function( password ) {
    var saltAndHash = Q.nbind( bcrypt.hash, bcrypt );
    return saltAndHash( password, 8 );
  },
  comparePasswordToDatabase: function( inputPassword, dbPassword ) {
    var compare = Q.nbind( bcrypt.compare, bcrypt );
    return compare( inputPassword, dbPassword );
  },
  createUser: function( req, res, next ) {
    req.body.email = req.body.email.toLowerCase();

    user.findOne( { where: { email: req.body.email } } )
    .then(function( foundUser ) {
      // if this email is already registered
      if ( foundUser ) {
        // throw 409
        throw new Error( 'This email address is already registered with Volta.' );
      // not found, good to save
      } else {
        return exports.saltAndHashPassword( req.body.password1 );
      }
    })
    .then(function( saltAndHashPassword ) {
      return user.create( { email: req.body.email, password: saltAndHashPassword, is_new: true, number_of_app_uses: 1 } );
    })
    .then(function( createdUser ) {
      return jwtFactory.createToken( createdUser );
    })
    .then(function( token ) {
      res.status( 201 ).send( { token: token } );
    })
    .catch(function( error ) {
      if ( error.message === 'This email address is already registered with Volta.' ) {
        res.status( 409 ).send( error.message );
      } else {
        res.status( 500 ).send( error );
      }
    });
  },
  authenticate: function( req, res ) {
    req.body.email = req.body.email.toLowerCase();

    // get user by email
    user.findOne( { where: { email: req.body.email } } )
    .then(function( foundUser ) {
      // if found
      if( foundUser ) {

        return exports.comparePasswordToDatabase( req.body.password, foundUser.password )
        .then(function( correctPassword ) {
          if ( correctPassword === true ) {
            return jwtFactory.createToken( foundUser );
          } else {
            throw new Error( 401 );
          }
        });

      // no user with that email found, but they don't need to know that, so just throw generic 401 - Unauthorized
      } else {
        throw new Error( 401 );
      }
    })
    .then(function( token ) {
      res.status( 200 ).send( { token: token } );
    })
    .catch(function( error ) {
      if ( error.message === '401' ) {
        res.status( 401 ).send( 'Please check your email and password.' );
      } else {
        res.status( 500 ).send( error );
      }
    });
  },
  resetPassword: function( req, res ) {
    var email = req.body.email.toLowerCase();

    // get user by email
    user.findOne( { where: { email: email } } )
    .then(function( foundUser ) {
      // if found
      if ( foundUser ) {
        res.send( {
          user: {
            id: foundUser.id,
            email_address: foundUser.email
          }
        } );
      } else {
        // return nothing to app server, it will not send email
        // this way, fishers don't know if was successful or not
        res.status( 200 ).send();
      }
    })
    .catch(function( error ) {
      res.status( 500 ).send( error );
    });
  },
  updatePassword: function( req, res ) {
    var givenUser = req.body.user;

    user.findOne({
      where: {
        id: givenUser.id,
        email: givenUser.email_address,
      }
    })
    .then( function( foundUser ) {
      if ( foundUser ) {
        return exports.saltAndHashPassword( req.body.user.password )
        .then(function( hashAndSalted ) {
          //update the user
          foundUser.password = hashAndSalted;
          return foundUser.save();
        });
      } else {
        throw new Error( 'No user found.' );
      }

    })
    .then(function( successUpdate ) {
      res.status( 200 ).send();
    })
    .catch( function( error ) {
      if ( error.message === 'No user found.' ) {
        res.status( 500 ).send( error.message );
      } else {
        res.status( 500 ).send( error );
      }
    });
  }
};