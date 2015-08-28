var user = require( '../../models' ).user;
var station = require( '../../models' ).station;
var async = require( 'async' );
var express = require( 'express' );
var Q = require( 'q' );
var env = process.env.NODE_ENV || 'development';
var calculateDistance = require( '../../factories/distanceFactory.js' ).getDistanceFromLatLonInMiles;

var groupByKin = function( stations ) {
  var deferred = Q.defer();
  var kinCached = {
    // kin: group
  };
  var groupedByKin = {
      // kin: common kin,
      // location: coloquial location, eg. Serra Shopping Center,
      // address: common location_address,
      // gps: [ lat, long ],
      // number_available: [ avail, total ],
      // distance: crow flies in miles
  };

  var numberOfStations = stations.length;
  for ( var i = 0; i < numberOfStations; i++ ) {
    var station = stations[ i ];
    
  }

  return deferred.promise;
};

var geocodeGroupsWithoutGPS = function( groupsOfStations ) {
  var deferred = Q.defer();
  var geocodedGroups = [];

  async.forEachOf( groupsOfStations, function(group, kin, cb ) {
    // if we already have it cached
    if ( stationsWithoutGPSCache[ kin ] ) {
      // add the location
      group.gps = [ stationsWithoutGPSCache[ kin ][ 0 ].latitude, stationsWithoutGPSCache[ kin ][ 0 ].longitude ];
      group.androidGPS = {
        latitude: group.gps[ 0 ],
        longitude: group.gps[ 1 ]
      };
      geocodedGroups.push( group );
      cb( null );

    // not cached yet
    } else {
      // use geocoder service
      geocoder.geocode( group.address )
      .then(function( gpx ) {
        // add to cache
        stationsWithoutGPSCache[ kin ] = gpx;
        // add the location
        group.gps = [ gpx[ 0 ].latitude, gpx[ 0 ].longitude ];
        group.androidGPS = {
          latitude: group.gps[ 0 ],
          longitude: group.gps[ 1 ]
        };
        geocodedGroups.push( group );
        cb( null );
      })
      .catch(function( error ) {
        cb( error );
      });
    }
  }, function( error ) {
    if ( error ) {
      deferred.reject( error );
    } else {
      deferred.resolve( geocodedGroups );
    }
  });

  return deferred.promise;
};

module.exports = exports = {
  getFavoriteStations: function( req, res ) {
    var favoriteStations = [];
    user.find( { where: { id: req.url.substring(1) } } )
    .then(function( foundUser ) {
      // if you can find the user
      if ( foundUser ) {
        // check for favorites
        if ( foundUser.favorite_stations && foundUser.favorite_stations.length > 0 ) {
          // get stations by id
          station.findAll( { where: { id: { $in: foundUser.favorite_stations } }, order: [ 'kin', 'ASC'] )
          .then(function( stations ) {
            stations
          })
          .catch(function( error ) {
            
          });
        } else {
          res.send( favoriteStations );
        }

      // no user found
      } else {
        res.status( 404 ).send( 'Could not find a user with that ID' );
      }
    })
    .catch(function( error ) {
      res.status( 500 ).send( error );
    });
  }
};