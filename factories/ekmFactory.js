var Q = require( 'q' );
var request = require( 'request' );

// makes things testable
var http = {
  request: request
};

exports.isJSONParsable = function( check ) {
  try {
    JSON.parse( check );
  } catch ( error ) {
    return false;
  }

  return true;
};

exports.makeGetRequestToApi = function( url ) {
  var deferred = Q.defer();

  http.request( url, function( error, body, response ) {
    // if no error
    if( !error ) {
      // and its parsable
      if ( exports.isJSONParsable( response ) ) {
        var parsed = JSON.parse( response );
        console.log( 'parsed', parsed  );
        if ( parsed.readMeter ) {
          // send the response parsed
          deferred.resolve( parsed );
        } else {
          deferred.reject( 'insufficient data' );
        }
      } else {
        deferred.reject( 'API error' );
      }
    } else {
      deferred.reject( error );
    }
  });

  return deferred.promise;
};