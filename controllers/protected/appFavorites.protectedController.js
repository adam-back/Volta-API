var user = require( '../../models' ).user;
var station = require( '../../models' ).station;
var async = require( 'async' );
var express = require( 'express' );
var Q = require( 'q' );
var env = process.env.NODE_ENV || 'development';
var config    = require( '../../config/config' )[ env ];
var calculateDistance = require( '../../factories/distanceFactory.js' ).getDistanceFromLatLonInMiles;
var geocodeCache = require( '../../factories/geocodeCache.js' ).geocodeCache;
var geocoder = require( 'node-geocoder' )( 'google', 'https', { apiKey: config.googleApiKey, formatter: null } );

var countStationAvailability = function( usageCollection ) {
  var numberOfPlugsAvailable = 0;

  var numberOfPlugs = usageCollection.length;
  for ( var i = 0; i < numberOfPlugs; i++ ) {
    if ( usageCollection[ i ] === 'false' ) {
      numberOfPlugsAvailable++;
    }
  }

  return numberOfPlugsAvailable;
};

var groupByKin = function( stations ) {
  var groupedByKin = {
    // kin: {
      // kin: common kin,
      // location: coloquial location, eg. Serra Shopping Center,
      // adddress: full address,
      // addressLine1: 123 Main St.
      // addressLine2: Tucson, AZ 85720,
      // gps: [ lat, long ],
      // favorite:
      // ids: []
      // number_available: [ avail, total ],
      // distance: crow flies in miles
    // }
  };
  var JSON = [];

  var numberOfStations = stations.length;
  for ( var i = 0; i < numberOfStations; i++ ) {
    var station = stations[ i ];
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
      groupedByKin[ cutKin ].ids = [];
      groupedByKin[ cutKin ].app_sponsors = [];
      groupedByKin[ cutKin ].number_available = [ 0, 0 ];
      groupedByKin[ cutKin ].distance = null;
      groupedByKin[ cutKin ].favorite = true;

      var splitAddress = station.location_address.split( ', ' );

      groupedByKin[ cutKin ].addressLine1 = splitAddress[ 0 ];
      if ( splitAddress.length === 3 ) {
        groupedByKin[ cutKin ].addressLine2 = splitAddress[ 1 ] + ', ' + splitAddress[ 2 ];
      } else {
        groupedByKin[ cutKin ].addressLine1 += ', ' + splitAddress[ 1 ];
        groupedByKin[ cutKin ].addressLine2 = splitAddress[ 2 ] + ', ' + splitAddress[ 3 ];
      }
    }

    // grouping started
    groupedByKin[ cutKin ].ids.push( station.id );
    // if the grouping doesn't have GPS yet and the station can provide it
    if ( !Array.isArray( groupedByKin[ cutKin ].gps ) && Array.isArray( station.location_gps ) ) {
      // add GPS
      groupedByKin[ cutKin ].gps = station.location_gps;
    }

    if ( groupedByKin[ cutKin ].app_sponsors.length === 0 ) {
      if ( station.app_sponsors.length !== 0 ) {
        groupedByKin[ cutKin ].app_sponsors = station.app_sponsors;
      }
    }

    var available = groupedByKin[ cutKin ].number_available[ 0 ];
    var total = groupedByKin[ cutKin ].number_available[ 1 ];
    // if there is in-use data
    if ( Array.isArray( station.in_use ) ) {
      available += countStationAvailability( station.in_use );
      total += station.in_use.length;
    } else {
      // this is a fudge
      // assume station has at least one plug
      // assume it's available
      available += 1;
      total += 1;
    }

    groupedByKin[ cutKin ].number_available[ 0 ] = available;
    groupedByKin[ cutKin ].number_available[ 1 ] = total;
  }

  for ( var kin in groupedByKin ) {
    JSON.push( groupedByKin[ kin ] );
  }

  return JSON;
};

var geocodeGroupsWithoutGPS = function( groupsOfStations ) {
  var deferred = Q.defer();

  async.each( groupsOfStations, function( group, cb ) {
    // if we already have it cached
    if ( geocodeCache[ group.kin ] ) {
      // add the location
      group.gps = geocodeCache[ group.kin ];
      cb( null );

    // not cached yet
    } else {
      // use geocoder service
      geocoder.geocode( group.address )
      .then(function( gpx ) {
        // add to cache
        geocodeCache[ group.kin ] = [ gpx[ 0 ].latitude, gpx[ 0 ].longitude ];
        // add the location
        group.gps = [ gpx[ 0 ].latitude, gpx[ 0 ].longitude ];
        cb( null );
      })
      .catch(function( error ) {
        cb( null );
      });
    }
  }, function( error ) {
    deferred.resolve( groupsOfStations );
  });

  return deferred.promise;
};

var findDistances = function( userCoords, favorites ) {
  var numberOfFaves = favorites.length;
  for ( var i = 0; i < numberOfFaves; i++ ) {
    favorites[ i ].distance = calculateDistance( userCoords, favorites[ i ].gps );
  }

  return favorites;
};

module.exports = exports = {
  getFavoriteStations: function( req, res ) {
    var deferred = Q.defer();
    var stationsAndPlugs = [];

    user.find( { where: { id: req.query.id } } )
    .then(function( foundUser ) {
      // if you can find the user
      if ( foundUser ) {
        // check for favorites
        if ( foundUser.favorite_stations && foundUser.favorite_stations.length > 0 ) {
          // get stations by id
          station.findAll( { where: { id: { $in: foundUser.favorite_stations } } } )
          .then(function( stations ) {

            async.each( stations, function( station, cb ) {
              // get only the values of the station
              var plainStation = station.get( { plain: true } );
              // get the associated plugs for the station
              station.getPlugs()
              .then(function( plugs ) {
                return station.getAppSponsors()
                .then(function( appSponsors ) {
                  // if there are sponsors
                  plainStation.app_sponsors = [];

                  if ( appSponsors && appSponsors.length > 0 ) {
                    for ( var i = 0; i < appSponsors.length; i++ ) {
                      // uncomment this line Oct. 1 for Chevy
                      // plainStation.app_sponsors.push( appSponsors[ i ].get( { plain: true } ) );
                    }
                  }

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
                });
              })
              .catch(function( error ) {
                cb( error );
              });
            }, function( error ) {
              if ( error ) {
                deferred.reject( error );
              } else {
                // deferred.resolve( stationsAndPlugs );
                geocodeGroupsWithoutGPS( groupByKin( stationsAndPlugs ) )
                .then(function( geocoded ) {
                  res.send( findDistances( req.query.userCoords, geocoded ) );
                })
                .catch(function( error ) {
                  res.status( 500 ).send( 'There was an error finding you favorites. Let\'s try again later.' );
                });
              }
            });
          });
        } else {
          res.send( [] );
        }

      // no user found
      } else {
        res.status( 404 ).send( 'Could not find a user with that ID' );
      }
    })
    .catch(function( error ) {
      res.status( 500 ).send( error );
    });
  },
  addFavoriteStation: function( req, res ) {
    // get stations associated with that cut kin
    station.findAll( { where: { id: { $in: req.body.group } } } )
    .then(function( stations ) {
      return user.find( { where: { id: req.body.userId } } )
      .then(function( user ) {
        var favorites = user.favorite_stations || [];
        // add stations to user favorites
        var numberOfStations = stations.length;
        for ( var i = 0; i < numberOfStations; i++ ) {
          favorites.push( stations[ i ].id );
        }

        return user.updateAttributes( { 'favorite_stations': favorites } );
      });
    })
    .then(function() {
      res.send();
    })
    .catch(function( error ) {
      res.status( 500 ).send( error );
    });
  },
  removeFavoriteStation: function( req, res ) {
    user.find( { where: { id: req.body.userId } } )
    .then(function( user ) {
      var favorites = user.favorite_stations;
      var idsToRemove = {};
      var newFavorites = [];

      for ( var i = 0; i < req.body.group.length; i++ ) {
        idsToRemove[ req.body.group[ i ] ] = true;
      }

      for ( var j = 0; j < favorites.length; j++ ) {
        if ( idsToRemove[ favorites[ j ] ] !== true ) {
          newFavorites.push( favorites[ j ] );
        }
      }

      return user.updateAttributes( { 'favorite_stations': newFavorites } );
    })
    .then(function() {
      res.send();
    })
    .catch(function( error ) {
      res.status( 500 ).send( error );
    });
  }
};