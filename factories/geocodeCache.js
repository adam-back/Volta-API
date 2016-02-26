var Q = require( 'q' );
var env = process.env.NODE_ENV || 'development';
var config    = require( '../config/config' )[ env ];
var geocoder = require( 'node-geocoder' )( 'google', 'https', { apiKey: config.googleApiKey, formatter: null } );

exports.geocodeCache = {
  // cutKin : [ lat, lon ]
};

exports.geocodeOneGroup = function( kin, address ) {
  var deferred = Q.defer();

  // returns a weird promise
  geocoder.geocode(address, function( error, gpx ) {
    if ( error ) {
      deferred.reject( error );
    } else {
      exports.geocodeCache[ kin ] = [ gpx[ 0 ].latitude, gpx[ 0 ].longitude ];
      deferred.resolve( [ kin, gpx ] );
    }
  });

  return deferred.promise;
};

exports.geocodeGroupsWithoutGPS = function( groupsOfStations ) {
  var geocodedGroups = [];
  var needGeocoding = [];

  for ( var kin in groupsOfStations ) {
    var group = groupsOfStations[ kin ];
    // if we already have it cached
    if ( exports.geocodeCache[ kin ] ) {
      // add the location
      group.gps = [ exports.geocodeCache[ kin ][ 0 ], exports.geocodeCache[ kin ][ 1 ] ];
      geocodedGroups.push( group );

    // not cached yet
    } else {
      // use geocoder service
      needGeocoding.push( exports.geocodeOneGroup( kin, group.address ) );
    }
  }

  return Q.all( needGeocoding )
  .then(function( resultsOfGeocoding ) {
    var numberOfResults = resultsOfGeocoding.length;
    for ( var i = 0; i < numberOfResults; i++ ) {
      var kin = resultsOfGeocoding[ i ][ 0 ];
      var gpx = resultsOfGeocoding[ i ][ 1 ];
      groupsOfStations[ kin ].gps = [ gpx[ 0 ].latitude, gpx[ 0 ].longitude ];
      geocodedGroups.push( groupsOfStations[ kin ] );
    }

    return geocodedGroups;
  });
};