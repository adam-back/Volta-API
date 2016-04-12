var jwt = require( 'jsonwebtoken' );
var config = require( '../config/config' ).development;

exports.createToken = function( expirationInMinutes ) {
  var options = {
    issuer: config.issuer,
    expiresIn: expirationInMinutes
  };

  return jwt.sign( {}, config.secret, options );
};