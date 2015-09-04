var user = require( '../../models' ).user;
var express = require( 'express' );
var Q = require( 'q' );
var env = process.env.NODE_ENV || 'development';
var config    = require( '../../config/config' )[ env ];
var bcrypt = require( 'bcrypt' );
var jwt = require( 'jsonwebtoken' );

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
  createUser: function( req, res ) {
    req.body.email = req.body.email.toLowerCase();

    user.find( { where: { email: req.body.email } } )
    .then(function( foundUser ) {
      // if this email is already registered
      if ( foundUser ) {
        // send conflict
        res.status( 409 ).send( 'This email address is already registered with Volta' );

      // not found, good to save
      } else {
        bcrypt.hash( req.body.password1, 8, function( error, hashAndSalted ) {
          if ( error ) {
            res.status( 500 ).send( error );
          } else {
            console.log( 'hashAndSalted', hashAndSalted );
            user.create( { email: req.body.email, password: hashAndSalted, is_new: true, number_of_app_uses: 1 } )
            .then(function( created ) {
              res.status( 201 ).send( { token: createToken( created ) } );
            })
            .catch(function( error ) {
              console.log( 'on create', error );
              res.status( 500 ).send( error );
            })
          }
        });
      }
    })
    .catch(function( error ) {
      console.log( 'errror', error );
      res.status( 500 ).send( error );
    });
  },
  authenticate: function( req, res ) {
    req.body.email = req.body.email.toLowerCase();

    // get user by email
    user.findOne( { where: { email: req.body.email } } )
    .then(function( foundUser ) {
      // if found
      if( foundUser ) {
        // compare to save password
        bcrypt.compare( req.body.password1, foundUser.password, function( error, result ) {
          if( result === true ) {
            // create and send token back
            res.status( 200 ).send( { token: createToken( foundUser ) } );

          // password didn't match
          } else {
            res.status( 401 ).send( 'Please check your email and password.' );
          }
        });

      // no user with that email found
      } else {
        // send not able to authenticate
        res.status( 401 ).send( 'Please check your email and password.' );
      }
    })
    .catch(function( error ) {
      res.status( 500 ).send( error );
    });
  },
  resetPassword: function( req, res ) {
    req.body.email = req.body.email.toLowerCase();

    // get user by email
    user.findOne( { where: { email: req.body.email } } )
    .then(function( foundUser ) {
      // if found
      if ( foundUser ) {
        res.status( 200 ).send( {
          user: {
            id: foundUser.id,
            email_address: foundUser.email_address
          }
        } );
      } else {
        res.status( 200 ).send();
      }
    })
    .catch(function( error ) {
      res.status( 500 ).send( error );
    });
  }
};