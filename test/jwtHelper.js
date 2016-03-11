var jwt = require( 'jsonwebtoken' );
var config = require( '../config/config' ).development;

exports.createToken = function() {
  var options = {
    issuer: config.issuer,
    expiresIn: 60
  };

  return jwt.sign( {}, config.secret, options );
};