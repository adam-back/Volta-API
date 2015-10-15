var Q = require( 'q' );
var request = require( 'request' );
var env = process.env.NODE_ENV || 'development';
var config = require( '../config/config' )[ env ];

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

exports.makeMeterUrl = function( meter ) {
  var url = 'http://io.ekmpush.com/readMeter/';

  if( meter.match( /3[0]{1}[0-9]{7}|3[0]{2}[0-9]{6}|3[0]{3}[0-9]{5}|3[0]{4}[0-9]{4}|3[0]{5}[0-9]{3}|3[0]{6}[0-9]{2}|3[0]{7}[0-9]{1}|3[0]{8}/ ) ) {
    //version 4
    url += 'v4';
  } else {
    //version 3
    url += 'v3';
  }
  url += '/key/' + config.ekmApiKey + '/count/10/format/html/meters/' + meter;

  return url;
};