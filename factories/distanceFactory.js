exports.convertDegreesToRadians = function( degrees ) {
  return degree * ( Math.PI / 180 );
};

// for making calculations "as the crow flies"
exports.getDistanceFromLatLonInMiles = function( start, finish ) {
  // lat, long
  var radiusOfEarthInKm = 6371;
  var deltaLatitude = exports.convertDegreesToRadians( finish[ 0 ] - start[ 0 ] );  // deg2rad below
  var deltaLongitude = exports.convertDegreesToRadians( finish[ 1 ] - start[ 1 ] );
  var a =
    Math.sin( deltaLatitude / 2 ) * Math.sin( deltaLatitude / 2 ) +
    Math.cos( exports.convertDegreesToRadians( start[ 0 ] ) ) * Math.cos( exports.convertDegreesToRadians( finish[ 0 ] ) ) *
    Math.sin( deltaLongitude / 2 ) * Math.sin( deltaLongitude / 2 );
  var c = 2 * Math.atan2( Math.sqrt( a ), Math.sqrt( 1 - a ) );
  // distanceInKm
  var d = radiusOfEarthInKm * c;
  var miles = 0.621371 * d;
  return miles;
};
