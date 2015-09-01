var station = require( '../../models').station;
var station_report = require( '../../models' ).station_report;
var user = require( '../../models' ).user;
var geocodeCache = require( '../../factories/geocodeCache.js' ).geocodeCache;
var express = require( 'express' );
var async     = require( 'async' );
var Q = require( 'q' );
var env = process.env.NODE_ENV || 'development';
var config    = require( '../../config/config' )[ env ];
var geocoder = require( 'node-geocoder' )( 'google', 'https', { apiKey: config.googleApiKey, formatter: null } );

var createToken = function( user ) {
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

  return jwt.sign( payload, config.appSecret, options );
};

var connectStationsWithPlugs = function( stations ) {
  var deferred = Q.defer();
  var stationsAndPlugs = [];

  // for each station
  async.each( stations, function( station, cb ) {
    // get only the values of the station
    var plainStation = station.get( { plain: true } );
    // get the associated plugs for the station
    station.getPlugs()
    .then(function( plugs ) {
      // if there are plugs, i.e. push and cloudgate installed
      if ( plugs && plugs.length > 0 ) {
        // create a plugs field on the station
        plainStation.plugs = [];
        // for each plug on the station
        for ( var i = 0; i < plugs.length; i++ ) {
          // push the values of plug to the plugs array on station
          plainStation.plugs[ plugs[ i ].number_on_station - 1 ] = plugs[ i ].get( { plain: true } );
        }
      // station not metered, no plugs
      } else {
        plainStation.plugs = null;
      }

      stationsAndPlugs.push( plainStation );
      cb( null );
    })
    .catch(function( error ) {
      cb( error );
    });
  }, function( error ) {
    if ( error ) {
      deferred.reject( error );
    } else {
      deferred.resolve( stationsAndPlugs );
    }
  });

  return deferred.promise;
};

var groupByKin = function( stationsWithPlugs ) {
  var deferred = Q.defer();
  var groupedByKin = {
      // kin: common kin,
      // location: coloquial location, eg. Serra Shopping Center,
      // address: common location_address,
      // gps: [ lat, long ],
      // androidGPS: {
          // latitude:,
          // longitude:
      // },
      // stations: array of stations
        // [{
            // id:
            // kin:
            // etc:
            // plugs: array of plugs
              // [{
                  // id:
                  // number_on_station:
                  // etc
              // }]
        // }]
    };

  async.each( stationsWithPlugs, function( station, cb ) {
    // cut off the station number and K/W
    // 001-0001-001-01-K becomes 001-0001-001
    var cutKin = station.kin.substring( 0, 12 );
    // if there is no grouping
    if ( !groupedByKin[ cutKin ] ) {
      // create it
      groupedByKin[ cutKin ] = {};
      groupedByKin[ cutKin ].kin = cutKin;
      groupedByKin[ cutKin ].location = station.location;
      groupedByKin[ cutKin ].address = station.location_address;
      groupedByKin[ cutKin ].gps = null;
      groupedByKin[ cutKin ].androidGPS = null;
      groupedByKin[ cutKin ].stations = [];
    }

    // add to the grouping by site number
    groupedByKin[ cutKin ].stations[ station.site_number - 1 ] = station;

    // if the grouping doesn't have GPS yet and the station can provide it
    if ( !Array.isArray( groupedByKin[ cutKin ].gps ) && Array.isArray( station.location_gps ) ) {
      // add GPS
      groupedByKin[ cutKin ].gps = station.location_gps;
      groupedByKin[ cutKin ].androidGPS = {
        latitude: station.location_gps[ 0 ],
        longitude: station.location_gps[ 1 ]
      };
    }
    cb( null );
  }, function( error ) {
    if ( error ) {
      deferred.reject( error );
    } else {
      deferred.resolve( groupedByKin );
    }
  });

  return deferred.promise;
};

var geocodeGroupsWithoutGPS = function( groupsOfStations ) {
  var deferred = Q.defer();
  var geocodedGroups = [];

  async.forEachOf( groupsOfStations, function(group, kin, cb ) {
    // if we already have it cached
    if ( geocodeCache[ kin ] ) {
      // add the location
      group.gps = [ geocodeCache[ kin ][ 0 ], geocodeCache[ kin ][ 0 ] ];
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
        geocodeCache[ kin ] = [ gpx[ 0 ].latitude, gpx[ 0 ].longitude ];
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
  getStationsAndPlugs: function ( req, res ) {
    var readyForReturn = [];

    // get all stations
    station.findAll()
    .then(function( stations ) {
      // connect all those stations with their respective plugs
      return connectStationsWithPlugs( stations );
    })
    .then(function( stationsAndPlugs ) {
      // group similar stations by kin
      return groupByKin( stationsAndPlugs );
    })
    .then(function( groupedKin ) {
      // add stations with GPS to ready
      for ( var kin in groupedKin ) {
        if ( Array.isArray( groupedKin[ kin ].gps ) ) {
          readyForReturn.push( groupedKin[ kin ] );
          // delete it so it won't get geocoded
          delete groupedKin[ kin ];
        }
      }
      // send the rest to be geocoded
      return geocodeGroupsWithoutGPS( groupedKin );
    })
    .then(function( geocoded ) {
      // add the geocoded kins and return
      res.json( readyForReturn.concat( geocoded ) );
    })
    .catch(function( error ) {
      res.status( 500 ).send( error );
    });
  },
  saveReport: function ( req, res ) {
    station_report.create( req.body )
    .then(function( success ) {
      res.status( 204 ).send(); // needs to be this for iOS app
    })
    .catch(function( error ) {
      res.status( 500 ).send( error );
    });
  }
};