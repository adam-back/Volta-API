var Q = require( 'q' );
var env = process.env.NODE_ENV || 'development';
var config    = require( '../config/config' )[ env ];
var jwt = require( 'jsonwebtoken' );

exports.createToken = function( user, expirationInMinutes ) {
  var deferred = Q.defer();

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

  jwt.sign( payload, config.appSecret, options, function( token ) {
    deferred.resolve( token );
  });

  return deferred.promise;
};