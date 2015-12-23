var station = require( '../../models').station;
var plug = require( '../../models').plug;
var charge_event = require( '../../models').charge_event;
var express = require( 'express' );
var async     = require( 'async' );
var Q = require( 'q' );
var env = process.env.NODE_ENV || 'development';
var config    = require( '../../config/config' )[ env ];
var ekm = require('../../factories/ekmFactory.js');
var geocoder = require( 'node-geocoder' )( 'google', 'https', { apiKey: config.googleApiKey, formatter: null } );
var greatCircleDistance = require( '../../factories/distanceFactory.js' ).getDistanceFromLatLonInMiles;
var generateCSV = require( '../../factories/csvFactory' ).generateCSV;
var helper = require( '../../factories/reportHelpers' );

module.exports = exports = {
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

        return broken;
      } else if ( type === 'CSV' ) {
        var fields = [ 'kin', 'location', 'location_address', 'network', 'ekm_omnimeter_serial', 'ekm_push_mac', 'number_on_station', 'ekm_url' ];
        var fieldNames = [ 'KIN', 'Location', 'Address', 'Network', 'Omnimeter S/N', 'Push MAC', 'Plug #', 'EKM Url' ];

        return generateCSV( broken, fields, fieldNames );
      }
    })
    .then(function( formattedReturn ) {
      res.send( formattedReturn );
    })
    .catch(function( error ) {
      res.status( 500 ).send( error );
    });
  },
  getStationsWithoutCoordinates: function( req, res ) {
    var type = req.params.output;

    station.findAll( { where: { location_gps: null }, order: 'kin ASC' } )
    .then(function( stations ) {
      if ( type === 'Web' ) {
        res.send( stations );
      } else if ( type === 'CSV' ) {
        var fields = [ 'kin', 'location', 'location_address', 'network' ];
        var fieldNames = [ 'KIN', 'Location', 'Address', 'Network' ];

        return generateCSV( stations, fields, fieldNames );
      }
    })
    .then(function( csv ) {
      res.send( csv );
    })
    .catch(function( error ) {
      res.status( 500 ).send( error );
    });
  },
  getMismatchedStationCoordinates: function( req, res ) {
    var type = req.params.output;

    var mismatched = [];
    // get all the stations
    station.findAll( { where: { location_gps: { $ne: null } }, attributes: [ 'kin', 'location', 'location_address', 'location_gps', 'network' ] } )
    .then(function( stationsWithCoordinates ) {
      var addressCache = {
        // address: [ coordinates ]
      };

      var time = 0;
      // go through all of the stations
      async.each( stationsWithCoordinates, function( station, cb ) {
        // check if we've cached the GPS coordinates for that station
        if ( addressCache[ station.location_address ] === undefined ) {
          // check the station's geocode against the saved coordinates on the model
          // use geocoder service
          time += 1000;
          setTimeout(function() {
            geocoder.geocode( station.location_address )
            .then(function( gpx ) {
              // add to cache
              addressCache[ station.location_address ] = [ gpx[ 0 ].latitude, gpx[ 0 ].longitude ];
              cb( null );
            })
            .catch(function( error ) {
              cb( error );
            });
          }, time);
        } else {
          cb( null );
        }
      }, function( error ) {
        // end of each loop
        if ( error ) {
          throw error;
        } else {
          // loop over address cache
          for ( var i = 0; i < stationsWithCoordinates.length; i++ ) {
            var station = stationsWithCoordinates[ i ];
            // check the station's geocode against the saved coordinates on the model
            var distance = greatCircleDistance( addressCache[ station.location_address ], station.location_gps );
            if (  distance > 1 ) {
              var plain = station.get( { plain: true } );
              plain.distance = distance;
              plain.location_gps = plain.location_gps.toString();
              mismatched.push( plain );
            }
          }

          if ( type === 'Web' ) {
            res.send( mismatched );
          } else if ( type === 'CSV' ) {
            var fields = [ 'kin', 'location', 'network', 'location_address', 'location_gps', 'distance' ];
            var fieldNames = [ 'KIN', 'Location', 'Network', 'Address', 'GPS Coordinates', 'Difference (mi.)' ];

            generateCSV( mismatched, fields, fieldNames )
            .then(function( csv ) {
              res.send( csv );
            })
            .catch(function( error ) {
              throw error;
            });
          }
        }
      });
    })
    .catch(function( error ) {
      res.status( 500 ).send( error );
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

    var saveData = function( key, total, subtract ) {
      data[ key ].data[ 0 ] = subtract;
      data[ key ].data[ 1 ] = total - subtract;
    };

    plug.count()
    .then(function( totalPlugs ) {
      return plug.count( { where: { meter_status: 'error', ekm_omnimeter_serial: { $ne: null } } } )
      .then(function( errorPlugs ) {
        saveData( 'broken', totalPlugs, errorPlugs );
        return plug.count( { where: { in_use: true } } );
      })
      .then(function( inUsePlugs ) {
        saveData( 'currentUsage', totalPlugs, inUsePlugs );
        return station.count();
      });
    })
    .then(function( totalStations ) {
      data.cumulative.numberOfStations = totalStations;
      return station.count( { where: { in_use: null } } )
      .then(function( numberOfUnmeteredStations ) {
        saveData( 'needMeter', totalStations, numberOfUnmeteredStations );
        return station.count( { where: { location_gps: null } } );
      })
      .then(function( stationsWithCoordinates ) {
        saveData( 'needGPS', totalStations, stationsWithCoordinates );
        return station.sum( 'cumulative_kwh' );
      });
    })
    .then(function( summativeKwh ) {
      data.cumulative.total = summativeKwh;
      data.cumulative.calcs = helper.convertKwhToConsumerEquivalents( summativeKwh );
      return charge_event.count();
    })
    .then(function( numberOfChargeEvents ) {
      data.cumulative.calcs.events = numberOfChargeEvents;
      return helper.getBrokenPlugs();
    })
    .then(function( brokenStuff ) {
      data.brokenStations = brokenStuff;
      return charge_event.findAll( { order: 'id DESC', limit: 10, attributes: [ 'time_start', 'id', 'station_id', 'plug_id' ] } );
    })
    .then(function( lastTenEvents ) {
      async.each(lastTenEvents, function( charge, cb ) {
        var plainCharge = charge.get( { plain: true } );
        plainCharge.time_start = charge.time_start;
        station.find( { where: { id: charge.station_id } } )
        .then(function( station ) {
          plainCharge.location = station.location;
          plainCharge.kin = station.kin;
          plainCharge.location_address = station.location_address;
          return plug.find( { where: { id: charge.plug_id } } );
        })
        .then(function( plug ) {
          plainCharge.ekm_omnimeter_serial = plug.ekm_omnimeter_serial;
          plainCharge.ekm_link = ekm.makeMeterUrl( plug.ekm_omnimeter_serial );
          data.recentCharges.push( plainCharge );
          cb( null );
        })
        .catch(function( error ) {
          cb( error );
        });
      }, function( error ) {
        if ( error ) {
          throw error;
        } else {
          data.recentCharges.sort(function( a, b ) {
            return b.id - a.id;
          });

          res.send( data );
        }
      });
    })
    .catch(function( error ) {
      res.status( 500 ).send( error );
    });
  },
  exportStationDataAsCsv: function( req, res ) {
    var fields = [ 'kin', 'location', 'location_address', 'network', 'ekm_push_mac', 'sim_card', 'cumulative_kwh' ];
    var fieldNames = [ 'KIN', 'Location', 'Address', 'Network', 'Push MAC', 'SIM card', 'Meter Reading (kWh)' ];

    station.findAll( { order: [ 'kin' ] } )
    .then(function( stations ) {
      return generateCSV( stations, fields, fieldNames );
    })
    .then(function( csv ) {
      res.send( csv );
    })
    .catch(function( error ) {
      res.status( 500 ).send( error );
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
        return generateCSV( wallMounts, fields, fieldNames );
      }
    })
    .then(function( formattedResponse ) {
      res.send( formattedResponse );
    })
    .catch(function( error ) {
      res.status( 500 ).send( error );
    });
  },
  listStationsWhichNeedMeters: function( req, res ) {
    var type = req.params.output;
    var fields = [ 'kin', 'location', 'location_address', 'network' ];
    var fieldNames = [ 'KIN', 'Location', 'Address', 'Network' ];

    plug.findAll( { raw: true } )
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
        return generateCSV( unmeteredStations, fields, fieldNames );
      }
    })
    .then(function( formattedResponse ) {
      res.send( formattedResponse );
    })
    .catch(function( error ) {
      res.status( 500 ).send( error );
    });
  },
  getChargeDataOverTime: function( req, res ) {
    helper.chargeEventsOverTime()
    .then(function( collection ) {
      var fields = [ 'time', 'events', 'kwh' ];
      var fieldNames [ 'End Of Period', 'Number of Sessions', 'Cumulative kWh' ];
      return generateCSV( collection, fields, fieldNames );
    })
    .then(function( csv ) {
      res.send( csv );
    })
    .catch(function( error ) {
      res.status( 500 ).send( error );
    });
  },

  // not complete
  getOneStationAnalytics: function (req, res) {
    var returnData = {
      kin: null,
      location: null,
      address: null,
      offset: 0,
      gallons: 0,
      trees: 0,
      miles: 0,
      lifetimeKilowatts: '',
      firstChargeEvent: '',
      totalChargeEventDays: '',
      totalChargeEvents: '',
      averageChargeEventsPerDay: '',
      medianChargeEventsPerDay: '',
      averageDurationOfEvent: '',
      medianDurationOfEvent: '',
      message: ''
    };

    // request has kin
    // search stations for kin
    station.findOne( { where: { kin: req.url.substring( 5 ) } } )
    .then(function( station ) {
      if ( typeof station === 'object' && station.dataValues ) {
        // there is data to get
        if ( station.cumulative_kwh ) {
          // SELECT SUM( kwh ) FROM charge_events WHERE station_id = station.id AND deleted_at IS NULL AND time_stop IS NOT NULL;
          return charge_event.count( { where: { station_id: station.id } } );
        } else {
          res.send( 'Unfortunately this station has no metrics :(' );
        }
      } else {
        res.status( 404 ).send();
      }
    })
    .then(function( count ) {
      returnData.chargeCount = count;

      return station.getPlugs();
    })
    .then(function( plugs ) {
      var kwh = 0;
      if ( Array.isArray( plugs ) && plugs.length > 0 ) {
        async.each(plugs, function ( plug, cb ) {
          ekm.makeGetRequestToApi("http://io.ekmpush.com/readMeter/v3/key/" + config.ekmApiKey + "/count/1/format/json/meters/" + plug.ekm_omnimeter_serial)
          .then(function( data ) {
            khw += data.readMeter.ReadSet[ 0 ].ReadData[ 0 ].kWh_Tot;
            cb(null);
          })
          .catch(function( error ) {
            cb(error);
          });
        }, function (error) {
          if ( error ) {
            throw error;
          } else {
            // based off of calculations from the EPA
            // http://www.epa.gov/cleanenergy/energy-resources/calculator.html
            returnData.offset = Math.round( 10 * ( kwh * 1.52 ) ) / 10;
            returnData.gallons = Math.round( 10 * ( kwh * 0.0766666 ) ) / 10;
            returnData.trees = Math.round( kwh * 0.01766666 );
            // Avg. Nissan Leaf from http://insideevs.com/long-term-nissan-leaf-mileageusage-review-once-around-the-sun/
            returnData.miles = Math.round( 10 * ( kwh * 5.44 ) ) / 10;
            res.send( returnData );
          }
        });
      } else {
        res.status( 404 ).send();
      }
    })
    .catch(function( error ) {
      res.status( 500 ).send(error);
    });
  }
};
