var station = require( '../../models').station;
var station_report = require( '../../models' ).station_report;
var station_image = require( '../../models' ).station_image;
var user = require( '../../models' ).user;
var app_sponsor = require( '../../models' ).app_sponsor;
var geocodeCache = require( '../../factories/geocodeCache.js' ).geocodeCache;
var express = require( 'express' );
var async     = require( 'async' );
var Q = require( 'q' );
var env = process.env.NODE_ENV || 'development';
var config    = require( '../../config/config' )[ env ];
var geocoder = require( 'node-geocoder' )( 'google', 'https', { apiKey: config.googleApiKey, formatter: null } );
var calculateDistance = require( '../../factories/distanceFactory.js' ).getDistanceFromLatLonInMiles;

module.exports = exports = {
  // methods used for data manipulation
  countStationAvailability: function( usageCollection ) {
    var numberOfPlugsAvailable = 0;

    var numberOfPlugs = usageCollection.length;
    for ( var i = 0; i < numberOfPlugs; i++ ) {
      if ( usageCollection[ i ] === 'false' ) {
        numberOfPlugsAvailable++;
      }
    }

    return numberOfPlugsAvailable;
  },
  findDistances: function( userCoords, favorites ) {
    var numberOfFaves = favorites.length;
    for ( var i = 0; i < numberOfFaves; i++ ) {
      favorites[ i ].distance = calculateDistance( userCoords, favorites[ i ].gps );
    }

    return favorites;
  },
  connectStationsWithPlugsAndSponsors: function( stations ) {
    var deferred = Q.defer();
    var stationsAndPlugs = [];

    // for each station
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
              plainStation.app_sponsors.push( appSponsors[ i ].get( { plain: true } ) );
            }
          }

          // if there are plugs, i.e. push and cloudgate installed
          if ( plugs && plugs.length > 0 ) {
            // create a plugs field on the station
            plainStation.plugs = [];
            // for each plug on the station
            for ( var j = 0; j < plugs.length; j++ ) {
              // push the values of plug to the plugs array on station
              plainStation.plugs[ plugs[ j ].number_on_station - 1 ] = plugs[ j ].get( { plain: true } );
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
        deferred.resolve( stationsAndPlugs );
      }
    });

    return deferred.promise;
  },
  attachImages: function( groups ) {
    var deferred = Q.defer();

    async.forEachOf(groups, function( group, commonKin, cb ) {
      station.find( { where: { kin: group.stations[ 0 ].kin } } )
      .then(function( foundStation ) {
        return foundStation.getStation_images();
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
  },
  groupByKin: function( stationsWithPlugs, userFaves ) {
    var deferred = Q.defer();
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
      }

      if ( userFaves && userFaves.length > 0 ) {
        // if this is a user favorite
        if ( userFaves.indexOf( station.id ) !== -1 ) {
          groupedByKin[ cutKin ].favorite = true;
        }
      }

      var splitAddress = station.location_address.split( ', ' );

      groupedByKin[ cutKin ].addressLine1 = splitAddress[ 0 ];
      if ( splitAddress.length === 3 ) {
        groupedByKin[ cutKin ].addressLine2 = splitAddress[ 1 ] + ', ' + splitAddress[ 2 ];
      } else {
        groupedByKin[ cutKin ].addressLine1 += ', ' + splitAddress[ 1 ];
        groupedByKin[ cutKin ].addressLine2 = splitAddress[ 2 ] + ', ' + splitAddress[ 3 ];
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

      if ( groupedByKin[ cutKin ].app_sponsors.length === 0 ) {
        if ( station.app_sponsors.length !== 0 ) {
          groupedByKin[ cutKin ].app_sponsors = station.app_sponsors;
        }
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
  },
  geocodeGroupsWithoutGPS: function( groupsOfStations ) {
    var deferred = Q.defer();
    var geocodedGroups = [];

    async.forEachOf( groupsOfStations, function(group, kin, cb ) {
      // if we already have it cached
      if ( geocodeCache[ kin ] ) {
        // add the location
        group.gps = [ geocodeCache[ kin ][ 0 ], geocodeCache[ kin ][ 1 ] ];
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
          geocodedGroups.push( group );
          cb( null );
        })
        .catch(function( error ) {
          cb( error );
        });
      }
    }, function( error ) {
      // if ( error ) {
      //   deferred.reject( error );
      // } else {
        deferred.resolve( geocodedGroups );
      // }
    });

    return deferred.promise;
  },
  //////////////////////////
  // route controllers below
  getStationsAndPlugs: function ( req, res ) {
    var readyForReturn = [];
    // get all stations
    station.findAll()
    .then(function( stations ) {
      return exports.connectStationsWithPlugsAndSponsors( stations );
    })
    .then(function( stationsAndPlugs ) {
      // if the user is logged in
      if ( req.query.id ) {
        // get their favorites
        return user.find( { where: { id: req.query.id } } )
        .then(function( foundUser ) {
          return exports.groupByKin( stationsAndPlugs, foundUser.favorite_stations );
        });
      // not logged in
      } else {
        // group similar stations by kin
        return exports.groupByKin( stationsAndPlugs );
      }
    })
    .then(function( groupedKin ) {
      return exports.attachImages( groupedKin );
    })
    .then(function( groupsWithImages ) {
      // count availability

      // add stations with GPS to ready
      for ( var kin in groupsWithImages ) {
        if ( Array.isArray( groupsWithImages[ kin ].gps ) ) {
          readyForReturn.push( groupsWithImages[ kin ] );
          // delete it so it won't get geocoded
          delete groupsWithImages[ kin ];
        }
      }
      // send the rest to be geocoded
      return exports.geocodeGroupsWithoutGPS( groupsWithImages );
    })
    .then(function( geocoded ) {
      readyForReturn = readyForReturn.concat( geocoded );

      // measure as-the-crow flies distances
      if ( req.query.userCoords ) {
        res.json( exports.findDistances( req.query.userCoords, readyForReturn ) );
      } else {
        res.json( readyForReturn );
      }
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
  },
  getAppSponsors: function ( req, res ) {
    // app_sponsor.create( { company: 'Chevrolet', networks: [ 'SD', 'OC', 'LA', 'SB', 'NoCal' ], website_url: 'http://www.chevrolet.com/', twitter_url: 'https://twitter.com/chevyvolt', facebook_url: 'https://www.facebook.com/chevroletvolt/info?tab=page_info', instagram_url: 'https://instagram.com/chevrolet/?hl=en', logo_url: 'http://img2.wikia.nocookie.net/__cb20141116144915/logopedia/images/f/f4/Chevrolet_logo-2.png', station_query: { where: { network: { $in: [ 'SD', 'OC', 'LA', 'SB', 'NoCAl' ] } } }, banner_url: 'http://cdn.realestate.ph/ad3_320x50.jpg', current: true, order: 3 } );

    // Create associations
    // app_sponsor.findAll( { where: { company: 'Chevrolet' } } )
    // .then(function( sponsor ) {
    //   // remove previous associations
    //   return sponsor[ 0 ].setStations( [] )
    //   .then(function() {
    //     // get all the stations per the query
    //     return station.findAll( sponsor[ 0 ].dataValues.station_query );
    //   })
    //   .then(function( stations ) {
    //     // readd
    //     return sponsor[ 0 ].addStations( stations );
    //   });
    // })
    // .then(function( done ) {
    //   res.send( done );
    // })

    app_sponsor.findAll( { where: { current: true }, order: [ 'order' ] } )
    .then(function( sponsors ) {
      res.send( sponsors );
    })
    .catch(function( error ) {
      res.status( 500 ).send( error );
    });
  }
};