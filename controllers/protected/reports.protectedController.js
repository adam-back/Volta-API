var station = require( '../../models').station;
var plug = require( '../../models').plug;
var charge_event = require( '../../models').charge_event;
var async     = require( 'async' );
var Q = require( 'q' );
var env = process.env.NODE_ENV || 'development';
var config    = require( '../../config/config' )[ env ];
var ekm = require('../../factories/ekmFactory.js');
var geocoder = require( 'node-geocoder' )( 'google', 'https', { apiKey: config.googleApiKey, formatter: null } );
var distance = require( '../../factories/distanceFactory.js' );
var generateCSV = require( '../../factories/csvFactory' ).generateCSV;
var csv = require( '../../factories/csvFactory' );
var helper = require( '../../factories/reportHelpers' );
var moment = require( 'moment' );

module.exports = exports = {
  geocodeLater: function( delay, address ) {
    var deferred = Q.defer();

    setTimeout(function() {
      geocoder.geocode( address )
      .then(function( gpx ) {
        deferred.resolve( gpx );
      })
      .catch(function( error ) {
        deferred.reject( error );
      });
    }, delay);

    return deferred.promise;
  },
  getBrokenPlugs: function ( req, res ) {
    var type = req.params.output;

    helper.getBrokenPlugs()
    .then(function( broken ) {
      if ( type === 'Web' ) {
        broken.sort(function( a, b ) {
          if ( a.kin.toLowerCase() < b.kin.toLowerCase() ) {
            return -1;
          } else {
            return 1;
          }
        });

        return Q( broken );
      } else if ( type === 'CSV' ) {
        var fields = [ 'kin', 'location', 'location_address', 'network', 'ekm_omnimeter_serial', 'ekm_push_mac', 'number_on_station', 'ekm_url' ];
        var fieldNames = [ 'KIN', 'Location', 'Address', 'Network', 'Omnimeter S/N', 'Push MAC', 'Plug #', 'EKM Url' ];

        return csv.generateCSV( broken, fields, fieldNames );
      } else {
        throw new Error( 'Output not supported: ' + type );
      }
    })
    .then(function( formattedReturn ) {
      res.send( formattedReturn );
    })
    .catch(function( error ) {
      res.status( 500 ).send( error.message );
    });
  },
  getStationsWithoutCoordinates: function( req, res ) {
    var type = req.params.output;

    station.findAll( { where: { location_gps: null }, order: 'kin ASC' } )
    .then(function( stations ) {
      if ( type === 'Web' ) {
        return Q( stations );
      } else if ( type === 'CSV' ) {
        var fields = [ 'kin', 'location', 'location_address', 'network' ];
        var fieldNames = [ 'KIN', 'Location', 'Address', 'Network' ];

        return csv.generateCSV( stations, fields, fieldNames );
      } else {
        throw new Error( 'Output not supported: ' + type );
      }
    })
    .then(function( data ) {
      res.send( data );
    })
    .catch(function( error ) {
      res.status( 500 ).send( error.message );
    });
  },
  getMismatchedStationCoordinates: function( req, res ) {
    var type = req.params.output;

    var mismatched = [];
    // get all the stations
    station.findAll( { where: { location_gps: { $ne: null } }, attributes: [ 'kin', 'location', 'location_address', 'location_gps', 'network' ], raw: true } )
    .then(function( stationsWithCoordinates ) {
      var addressCache = {
        // address: [ coordinates ]
      };

      var time = 0;
      // go through all of the stations
      async.each( stationsWithCoordinates, function( station, cb ) {
        // check if we've cached the GPS coordinates for that station
        if ( addressCache[ station.location_address ] === undefined ) {
          // set so that we don't geocode more than we need to
          addressCache[ station.location_address ] = true;
          // check the station's geocode against the saved coordinates on the model
          // use geocoder service
          time += 1000;

          exports.geocodeLater( time, station.location_address )
          .then(function( gpx ) {
            // add to cache
            addressCache[ station.location_address ] = [ gpx[ 0 ].latitude, gpx[ 0 ].longitude ];
            cb( null );
          })
          .catch(function( error ) {
            cb( error );
          });
        } else {
          cb( null );
        }
      }, function( error ) {
        // end of each loop
        if ( error ) {
          res.status( 500 ).send( error.message );
        } else {
          // loop over stations found with coordinates
          for ( var i = 0; i < stationsWithCoordinates.length; i++ ) {
            var station = stationsWithCoordinates[ i ];
            // check the station's geocode against the saved coordinates on the model
            var difference = distance.getDistanceFromLatLonInMiles( addressCache[ station.location_address ], station.location_gps );
            if (  difference > 1 ) {
              station.distance = difference;
              station.location_gps = station.location_gps.toString();
              mismatched.push( station );
            }
          }

          if ( type === 'Web' ) {
            res.send( mismatched );
          } else if ( type === 'CSV' ) {
            var fields = [ 'kin', 'location', 'network', 'location_address', 'location_gps', 'distance' ];
            var fieldNames = [ 'KIN', 'Location', 'Network', 'Address', 'GPS Coordinates', 'Difference (mi.)' ];

            csv.generateCSV( mismatched, fields, fieldNames )
            .then(function( csv ) {
              res.send( csv );
            })
            .catch(function( error ) {
              res.status( 500 ).send( error.message );
            });
          } else {
            res.status( 404 ).send( 'Output not supported: ' + type );
          }
        }
      });
    })
    .catch(function( error ) {
      res.status( 500 ).send( error.message );
    });
  },
  getDashboardData: function( req, res ) {
    var data = {
      broken: {
        labels: [ 'Error', 'OK' ],
        data: []
      },
      currentUsage: {
        labels: [ 'In Use', 'Available' ],
        data: []
      },
      needMeter: {
        labels: [ 'Needs Meter', 'Metered' ],
        data: []
      },
      needGPS: {
        labels: [ 'Needs Coordinates', 'Has Coordinates' ],
        data: []
      },
      cumulative: {
        numberOfStations: 0,
        total: 0,
        calcs: {}
      },
      recentCharges: [],
      brokenStations: []
    };

    // cache
    var plugs = {};
    var stations = {};

    var saveData = function( key, total, subtract ) {
      data[ key ].data[ 0 ] = subtract;
      data[ key ].data[ 1 ] = total - subtract;
    };

    plug.findAll( { raw: true } )
    .then(function( allPlugs ) {
      var numberOfPlugs = allPlugs.length;
      var errorPlugs = 0;
      var inUsePlugs = 0;

      for ( var i = 0; i < numberOfPlugs; i++ ) {
        var onePlug = allPlugs[ i ];
        // add to cache
        plugs[ onePlug.id ] = onePlug;

        // broken and metered
        if ( onePlug.meter_status === 'error' && onePlug.ekm_omnimeter_serial !== null ) {
          errorPlugs++;
        }

        // in use
        if ( onePlug.in_use === true ) {
          inUsePlugs++;
        }
      }

      saveData( 'broken', numberOfPlugs, errorPlugs );
      saveData( 'currentUsage', numberOfPlugs, inUsePlugs );

      return station.findAll( { raw: true } );
    })
    .then(function( allStations ) {
      data.cumulative.numberOfStations = allStations.length;
      var numberOfUnmeteredStations = 0;
      var stationsWithoutCoordinates = 0;
      var summativeKwh = 0;

      for ( var j = 0; j < data.cumulative.numberOfStations; j++ ) {
        var oneStation = allStations[ j ];

        stations[ oneStation.id ] = oneStation;

        // unmetered station
        if ( oneStation.in_use === null ) {
          numberOfUnmeteredStations++;
        }

        // station without GPS coordinates
        if ( oneStation.location_gps === null ) {
          stationsWithoutCoordinates++;
        }

        // system kWh
        oneStation.cumulative_kwh = Number( oneStation.cumulative_kwh );

        if ( typeof oneStation.cumulative_kwh === 'number' && !isNaN( oneStation.cumulative_kwh ) ) {
          summativeKwh += oneStation.cumulative_kwh;
        }
      }

      saveData( 'needMeter', data.cumulative.numberOfStations, numberOfUnmeteredStations );
      saveData( 'needGPS', data.cumulative.numberOfStations, stationsWithoutCoordinates );
      data.cumulative.total = Number( summativeKwh.toFixed( 0 ) );
      data.cumulative.calcs = helper.convertKwhToConsumerEquivalents( summativeKwh );

      return charge_event.count();
    })
    .then(function( numberOfChargeEvents ) {
      data.cumulative.calcs.events = numberOfChargeEvents;
      return helper.getBrokenPlugs();
    })
    .then(function( brokenStuff ) {
      data.brokenStations = brokenStuff;
      return charge_event.findAll( { order: 'id DESC', limit: 10, attributes: [ 'time_start', 'id', 'station_id', 'plug_id' ], raw: true } );
    })
    .then(function( lastTenEvents ) {
      // should be 10, but having it dynamic makes testing easier
      var numberOfEvents = lastTenEvents.length;
      for ( var k = 0; k < numberOfEvents; k++ ) {
        var oneEvent = lastTenEvents[ k ];

        var stationForEvent = stations[ oneEvent.station_id ];
        oneEvent.location = stationForEvent.location;
        oneEvent.kin = stationForEvent.kin;
        oneEvent.location_address = stationForEvent.location_address;

        var plugForEvent = plugs[ oneEvent.plug_id ];
        oneEvent.ekm_omnimeter_serial = plugForEvent.ekm_omnimeter_serial;
        oneEvent.ekm_link = ekm.makeMeterUrl( plugForEvent.ekm_omnimeter_serial );
        data.recentCharges.push( oneEvent );
      }

      res.send( data );
    })
    .catch(function( error ) {
      res.status( 500 ).send( error.message );
    });
  },
  exportStationDataAsCsv: function( req, res ) {
    var fields = [ 'kin', 'location', 'location_address', 'location_gps', 'network', 'install_date', 'ekm_push_mac', 'sim_card', 'cumulative_kwh' ];
    var fieldNames = [ 'KIN', 'Location', 'Address', 'GPS', 'Network', 'Install Date', 'Push MAC', 'SIM card', 'Meter Reading (kWh)' ];

    station.findAll( { order: [ 'kin' ], raw: true } )
    .then(function( stations ) {
      for ( var i = 0; i < stations.length; i++ ) {
        var oneStation = stations[ i ];
        if ( oneStation.location_gps ) {
          // make gps a string
          stations[ i ].location_gps = oneStation.location_gps.toString();
          oneStation = stations[ i ];
        }

        for ( var key in oneStation ) {
          if ( oneStation[ key ] === null ) {
            oneStation[ key ] = '';
          }
        }
      }
      return csv.generateCSV( stations, fields, fieldNames );
    })
    .then(function( csv ) {
      res.send( csv );
    })
    .catch(function( error ) {
      res.status( 500 ).send( error.message );
    });
  },
  generateListOfWallmounts: function( req, res ) {
    var type = req.params.output;
    var fields = [ 'kin', 'location', 'location_address', 'network' ];
    var fieldNames = [ 'KIN', 'Location', 'Address', 'Network' ];

    station.findAll( { where: { kin: { $like: '%-W' } }, raw: true, order: [ 'kin' ] } )
    .then(function( wallMounts ) {
      if ( type === 'Web' ) {
        return Q.when( wallMounts );
      } else {
        return csv.generateCSV( wallMounts, fields, fieldNames );
      }
    })
    .then(function( formattedResponse ) {
      res.send( formattedResponse );
    })
    .catch(function( error ) {
      res.status( 500 ).send( error.message );
    });
  },
  listStationsWhichNeedMeters: function( req, res ) {
    var type = req.params.output;
    var fields = [ 'kin', 'location', 'location_address', 'network' ];
    var fieldNames = [ 'KIN', 'Location', 'Address', 'Network' ];

    plug.findAll( { attributes: [ 'station_id' ], raw: true } )
    .then(function( plugs ) {
      var associatedStationIds = [];
      for ( var i = 0; i < plugs.length; i++ ) {
        associatedStationIds.push( plugs[ i ].station_id );
      }

      return station.findAll( { where: { id: { $notIn: associatedStationIds } }, raw: true, order: [ 'kin' ] } );
    })
    .then(function( unmeteredStations ) {
      if ( type === 'Web' ) {
        return Q.when( unmeteredStations );
      } else {
        return csv.generateCSV( unmeteredStations, fields, fieldNames );
      }
    })
    .then(function( formattedResponse ) {
      res.send( formattedResponse );
    })
    .catch(function( error ) {
      res.status( 500 ).send( error.message );
    });
  },
  getChargeDataOverTime: function( req, res ) {
    helper.chargeEventsOverTime( null, [ 30, 'minutes' ] )
    .then(function( collection ) {
      var fields = [ 'time', 'events', 'kwh' ];
      var fieldNames = [ 'End Of Period', 'Number of Sessions', 'Cumulative kWh' ];
      return csv.generateCSV( collection, fields, fieldNames );
    })
    .then(function( csv ) {
      res.send( csv );
    })
    .catch(function( error ) {
      res.status( 500 ).send( error.message );
    });
  },
  getLastThirtyDays: function( req, res ) {
    station.findAll( { raw: true } )
    .then(function( allStations ) {
      var promises = allStations.map( helper.chargesOverLastThirtyDaysForOneStation );
      return Q.all( promises );
    })
    .then(function( allData ) {
      var orderedByKin = helper.orderByKin( allData );
      var fields = [
        'kin',
        'location',
        'since',
        // cumulative kWh
        'kWh',
        'carbon',
        'miles',
        'trees',
        'gallons',
        // charge events
        'numberOfCharges',
        'averageChargeEventsPerDay',
        'medianChargeEventsPerDay',
        'averageDurationOfEvent',
        'medianDurationOfEvent',
        // Average kwh per event
        'averageKwhOfEvent',
        'averageCarbonPerEvent',
        'averageMilesPerEvent',
        'averageTreesPerEvent',
        'averageGallonsPerEvent',
        // Median kwh per event
        'medianKwhOfEvent',
        'medianCarbonPerEvent',
        'medianMilesPerEvent',
        'medianTreesPerEvent',
        'medianGallonsPerEvent'
      ];
      var fieldNames = [
        'KIN',
        'Location',
        'Start of 30 Days',
        // cumulative kWh
        '30 Day kWh',
        '30 Day Carbon Offset (lbs)',
        '30 Day Miles',
        '30 Day Trees',
        '30 Day Gallons',
        // charge events
        'Total Charges Events',
        'Average Charge Events/Day',
        'Median Charge Events/Day',
        'Average Duration Of Event',
        'Median Duration Of Event',
        // Average kwh per event
        'Average kWh Per Event',
        'Average Carbon Offset Per Event',
        'Average Miles Per Event',
        'Average Trees Per Event',
        'Average Gallons Per Event',
        // Median kwh per event
        'Median kWh Of Event',
        'Median Carbon Offset Per Event',
        'Median Miles Per Event',
        'Median Trees Per Event',
        'Median Gallons Per Event'
      ];

      return csv.generateCSV( orderedByKin, fields, fieldNames );
    })
    .then(function( csv ) {
      res.send( csv );
    })
    .catch(function( error ) {
      res.status( 500 ).send( error.message );
    });
  },
  generateQuarterlyReport: function( req, res ) {
    // GET request with params specifying which quarter
    Q()
    .then(function() {
      // necessary params exist
      if ( !req.query.quarter || !req.query.year ) {
        throw new Error( 'Please specify the quarter and year for this report.' );
      } else {
        return Q();
      }
    })
    .then(function() {
      // get oldest event
      return charge_event.findAll( { limit: 1, order: [ [ 'time_start', 'ASC' ] ], raw: true } );
    })
    .then(function( oldestEvent ) {
      // is oldest event older than one week?
      // i.e. check if migration is complete
      oldestEvent = oldestEvent[ 0 ];
      if ( moment.utc( oldestEvent.time_start ).isBefore( moment.utc().subtract( 7, 'days' ) ) ) {
        throw new Error( 'Migration not complete.' );
      }

      return helper.generateQuarterlyReport( req.query.quarter, req.query.year );
    })
    .then(function( csv ) {
      res.send( csv );
    })
    .catch(function( error ) {
      res.status( 500 ).send( { error: error.message } );
    });
  }

  // not complete
  // getOneStationAnalytics: function (req, res) {
  //   var returnData = {
  //     kin: null,
  //     location: null,
  //     address: null,
  //     offset: 0,
  //     gallons: 0,
  //     trees: 0,
  //     miles: 0,
  //     lifetimeKilowatts: '',
  //     firstChargeEvent: '',
  //     totalChargeEventDays: '',
  //     totalChargeEvents: '',
  //     averageChargeEventsPerDay: '',
  //     medianChargeEventsPerDay: '',
  //     averageDurationOfEvent: '',
  //     medianDurationOfEvent: '',
  //     message: ''
  //   };

  //   // request has kin
  //   // search stations for kin
  //   station.findOne( { where: { kin: req.url.substring( 5 ) } } )
  //   .then(function( station ) {
  //     if ( typeof station === 'object' && station.dataValues ) {
  //       // there is data to get
  //       if ( station.cumulative_kwh ) {
  //         // SELECT SUM( kwh ) FROM charge_events WHERE station_id = station.id AND deleted_at IS NULL AND time_stop IS NOT NULL;
  //         return charge_event.count( { where: { station_id: station.id } } );
  //       } else {
  //         res.send( 'Unfortunately this station has no metrics :(' );
  //       }
  //     } else {
  //       res.status( 404 ).send();
  //     }
  //   })
  //   .then(function( count ) {
  //     returnData.chargeCount = count;

  //     return station.getPlugs();
  //   })
  //   .then(function( plugs ) {
  //     var kwh = 0;
  //     if ( Array.isArray( plugs ) && plugs.length > 0 ) {
  //       async.each(plugs, function ( plug, cb ) {
  //         ekm.makeGetRequestToApi("http://io.ekmpush.com/readMeter/v3/key/" + config.ekmApiKey + "/count/1/format/json/meters/" + plug.ekm_omnimeter_serial)
  //         .then(function( data ) {
  //           khw += data.readMeter.ReadSet[ 0 ].ReadData[ 0 ].kWh_Tot;
  //           cb(null);
  //         })
  //         .catch(function( error ) {
  //           cb(error);
  //         });
  //       }, function (error) {
  //         if ( error ) {
  //           throw error;
  //         } else {
  //           // based off of calculations from the EPA
  //           // http://www.epa.gov/cleanenergy/energy-resources/calculator.html
  //           returnData.offset = Math.round( 10 * ( kwh * 1.52 ) ) / 10;
  //           returnData.gallons = Math.round( 10 * ( kwh * 0.0766666 ) ) / 10;
  //           returnData.trees = Math.round( kwh * 0.01766666 );
  //           // Avg. Nissan Leaf from http://insideevs.com/long-term-nissan-leaf-mileageusage-review-once-around-the-sun/
  //           returnData.miles = Math.round( 10 * ( kwh * 5.44 ) ) / 10;
  //           res.send( returnData );
  //         }
  //       });
  //     } else {
  //       res.status( 404 ).send();
  //     }
  //   })
  //   .catch(function( error ) {
  //     res.status( 500 ).send(error);
  //   });
  // }
};
