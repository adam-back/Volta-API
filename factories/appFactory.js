var station = require( '../models').station;
var station_report = require( '../models' ).station_report;
var station_image = require( '../models' ).station_image;
var user = require( '../models' ).user;
var app_sponsor = require( '../models' ).app_sponsor;
var cache = require( './geocodeCache.js' );
var async     = require( 'async' );
var Q = require( 'q' );
var distance = require( './distanceFactory.js' );

exports.countStationAvailability = function( usageCollection ) {
  var numberOfPlugsAvailable = 0;

  var numberOfPlugs = usageCollection.length;
  for ( var i = 0; i < numberOfPlugs; i++ ) {
    if ( usageCollection[ i ] === 'false' ) {
      numberOfPlugsAvailable++;
    }
  }

  return numberOfPlugsAvailable;
};

exports.findDistances = function( userCoords, favorites ) {
  var numberOfFaves = favorites.length;
  for ( var i = 0; i < numberOfFaves; i++ ) {
    favorites[ i ].distance = distance.getDistanceFromLatLonInMiles( userCoords, favorites[ i ].gps );
  }

  return favorites;
};

exports.connectStationsWithPlugsAndSponsors = function( stations ) {
  var deferred = Q.defer();
  var stationsAndPlugs = [];

  // for each station
  async.each( stations, function( station, cb ) {
    // get only the values of the station
    var plainStation = station.get( { plain: true } );
    // get the associated plugs for the station
    station.getPlugs()
    .then(function( plugs ) {
      return station.getAppSponsors( { where: { current: true } } )
      .then(function( appSponsors ) {
        // if there are plugs, i.e. push and cloudgate installed
        var numberOfPlugs = plugs.length;
        if ( plugs && numberOfPlugs > 0 ) {
          // create a plugs field on the station
          plainStation.plugs = [];
          // for each plug on the station
          for ( var j = 0; j < numberOfPlugs; j++ ) {
            // push the values of plug to the plugs array on station
            plainStation.plugs[ plugs[ j ].number_on_station - 1 ] = plugs[ j ].get( { plain: true } );
          }
        // station not metered, no plugs
        } else {
          plainStation.plugs = null;
        }

        plainStation.app_sponsors = [];
        // if there are sponsors
        var numberOfAppSponsors = appSponsors.length;
        if ( appSponsors && numberOfAppSponsors > 0 ) {
          for ( var i = 0; i < numberOfAppSponsors; i++ ) {
            plainStation.app_sponsors.push( appSponsors[ i ].get( { plain: true } ) );
          }
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
      deferred.resolve( stationsAndPlugs );
    }
  });

  return deferred.promise;
};

exports.attachImages = function( groups ) {
  var deferred = Q.defer();

  async.forEachOf(groups, function( group, commonKin, cb ) {
    station.find( { where: { kin: group.stations[ 0 ].kin } } )
    .then(function( foundStation ) {
      return foundStation.getStation_images( { where: { approved: true } } );
    })
    .then(function( images ) {
      // if there are images for this station
      if ( images.length > 0 ) {
        // loop through them
        for ( var i = 0; i < images.length; i++ ) {
          // if it's the thumbnail
          if (  images[ i ].link.match( /thumb/ ) !== null ) {
            groups[ commonKin ].thumbnail = images[ i ].link ;

          // it's a full-size image
          } else {
            groups[ commonKin ].images.push( images[ i ].link );
          }
        }
      }

      cb( null );
    })
    .catch(function( error ) {
      cb( error );
    });
  }, function( error ) {
    if ( error ) {
      deferred.reject( error );
    } else {
      deferred.resolve( groups );
    }
  });

  return deferred.promise;
};

exports.groupByKin = function( stationsWithPlugs, userFaves ) {
  var groupedByKin = {
      // kin: common kin,
      // location: coloquial location, eg. Serra Shopping Center,
      // address: common location_address,
      // thumbnail: url
      // images: [ url, url ],
      // gps: [ lat, long ],
      // ids: [],
      // app_sponsors: []
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

  var numberOfStationsWithPlugs = stationsWithPlugs.length;
  for ( var i = 0; i < numberOfStationsWithPlugs; i++ ) {
    var station = stationsWithPlugs[ i ];

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
      groupedByKin[ cutKin ].thumbnail = null;
      groupedByKin[ cutKin ].images = [];
      groupedByKin[ cutKin ].gps = null;
      groupedByKin[ cutKin ].url = null;
      groupedByKin[ cutKin ].ids = [];
      groupedByKin[ cutKin ].app_sponsors = [];
      groupedByKin[ cutKin ].number_available = [ 0, 0 ];
      groupedByKin[ cutKin ].distance = null;
      groupedByKin[ cutKin ].stations = [];
      groupedByKin[ cutKin ].favorite = false;

      var splitAddress = station.location_address.split( ', ' );

      groupedByKin[ cutKin ].addressLine1 = splitAddress[ 0 ];
      if ( splitAddress.length === 3 ) {
        groupedByKin[ cutKin ].addressLine2 = splitAddress[ 1 ] + ', ' + splitAddress[ 2 ];
      } else {
        groupedByKin[ cutKin ].addressLine1 += ', ' + splitAddress[ 1 ];
        groupedByKin[ cutKin ].addressLine2 = splitAddress[ 2 ] + ', ' + splitAddress[ 3 ];
      }
    }

    // if it hasn't been flagged as favorite yet
    if ( groupedByKin[ cutKin ].favorite === false && Array.isArray( userFaves ) && userFaves.length > 0 ) {
      // if this is a user favorite
      if ( userFaves.indexOf( station.id ) !== -1 ) {
        groupedByKin[ cutKin ].favorite = true;
      }
    }

    // add to the grouping by site number
    groupedByKin[ cutKin ].stations[ station.site_number - 1 ] = station;
    groupedByKin[ cutKin ].ids.push( station.id );

    // count availability
    var available = groupedByKin[ cutKin ].number_available[ 0 ];
    var total = groupedByKin[ cutKin ].number_available[ 1 ];
    // if there is in-use data
    if ( Array.isArray( station.in_use ) ) {
      available += exports.countStationAvailability( station.in_use );
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

    // if the grouping doesn't have GPS yet and the station can provide it
    if ( !Array.isArray( groupedByKin[ cutKin ].gps ) && Array.isArray( station.location_gps ) ) {
      // add GPS
      groupedByKin[ cutKin ].gps = station.location_gps;
      groupedByKin[ cutKin ].androidGPS = {
        latitude: station.location_gps[ 0 ],
        longitude: station.location_gps[ 1 ]
      };
    }

    if ( groupedByKin[ cutKin ].app_sponsors.length === 0 && station.app_sponsors.length !== 0 ) {
      groupedByKin[ cutKin ].app_sponsors = station.app_sponsors;
    }
  }

  return groupedByKin;
};

exports.formatStationsForApp = function( whichStations, userId, userCoords ) {
  var readyForReturn = [];
  var query = whichStations || {};

  // get all stations
  return station.findAll( query )
  .then(function( stations ) {
    return exports.connectStationsWithPlugsAndSponsors( stations );
  })
  .then(function( stationsAndPlugs ) {
    // if the user is logged in
    if ( userId ) {
      // get their favorites
      return user.find( { where: { id: userId } } )
      .then(function( foundUser ) {
        return Q( exports.groupByKin( stationsAndPlugs, foundUser.favorite_stations ) );
      });
    // not logged in
    } else {
      // group similar stations by kin
      return Q( exports.groupByKin( stationsAndPlugs ) );
    }
  })
  .then(function( groupedKin ) {
    return exports.attachImages( groupedKin );
  })
  .then(function( groupsWithImages ) {
    // add stations with GPS to ready
    for ( var kin in groupsWithImages ) {
      if ( Array.isArray( groupsWithImages[ kin ].gps ) ) {
        readyForReturn.push( groupsWithImages[ kin ] );
        // delete it so it won't get geocoded
        delete groupsWithImages[ kin ];
      }
    }
    // send the rest to be geocoded
    return cache.geocodeGroupsWithoutGPS( groupsWithImages );
  })
  .then(function( geocoded ) {
    readyForReturn = readyForReturn.concat( geocoded );

    // measure as-the-crow flies distances
    if ( userCoords ) {
      readyForReturn = exports.findDistances( userCoords, readyForReturn );
    }

    return readyForReturn;
  });
};