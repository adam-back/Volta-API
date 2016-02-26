var user = require( '../../models' ).user;
var Q = require( 'q' );
var env = process.env.NODE_ENV || 'development';
var config    = require( '../../config/config' )[ env ];
var bcrypt = require( 'bcrypt' );
var jwtFactory = require( '../../factories/jwtFactory' );

var createToken = function( user, expirationInMinutes ) {
  var payload = {
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    username: user.username,
    facebook_id: user.facebook_id,
    user_picture: user.user_picture,
    car_picture: user.car_picture,
    stored_locations: user.stored_locations,
    favorite_stations: user.favorite_stations,
    phone_number: user.phone_number,
    number_of_checkins: user.number_of_checkins,
    kwh_used: user.kwh_used,
    freemium_level: user.freemium_level,
    number_of_app_uses: user.number_of_app_uses,
    is_new: user.is_new
  };

  var options = {
    issuer: config.issuer,
  };

  if( expirationInMinutes ) {
    options.expiresInMinutes = expirationInMinutes;
  }

  return jwt.sign( payload, config.appSecret, options );
};

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
    console.log( 'reset password - req body', req.body );
    var email = req.body.email.toLowerCase();

    // get user by email
    user.findOne( { where: { email: email } } )
    .then(function( foundUser ) {
      // if found
      if ( foundUser ) {
        console.log( 'found user', foundUser );
        res.send( {
          user: {
            id: foundUser.id,
            email_address: foundUser.email
          }
        } );
      } else {
        console.log( 'no user found' );
        res.status( 200 ).send();
      }
    })
    .catch(function( error ) {
      console.log( 'error getting user while resetting password', error );
      res.status( 500 ).send( error );
    });
  },
  updatePassword: function( req, res ) {

    var givenUser = req.body.user;

    user.findOne( {
      where: { 
        id: givenUser.id,
        email: givenUser.email_address,
      }
    })
    .then( function( foundUser ) {
      console.log( 'found user', foundUser );
      //update the user
      bcrypt.hash( req.body.user.password, 8, function( error, hashAndSalted ) {
        if ( error ) {
          console.log( 'failed to hash password', error );
          res.status( 500 ).send( error );
        } else {
          console.log( 'hashAndSalted', hashAndSalted );
          foundUser.password = hashAndSalted;

          foundUser.save()
          .then( function( savedUser ) {
            console.log( 'saved new password successfully' );
            res.status( 200 ).send();
          })
          .catch(function( error ) {
            console.log( 'on update password', error );
            res.status( 500 ).send( error );
          })
        }
      });
    })
    .catch( function( error ) {
      console.log( 'Reset password - user id and email do not match' );
      res.status( 500 ).send( error );
    })
  }
};