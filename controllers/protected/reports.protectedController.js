var station = require( '../../models').station;
var plug = require( '../../models').plug;
var charge_event = require( '../../models').charge_event;
var express = require( 'express' );
var async     = require( 'async' );
var Q = require( 'q' );
var env = process.env.NODE_ENV || 'development';
var config    = require( '../../config/config' )[ env ];
var apiRequest = require('../../factories/ekmFactory.js').makeGetRequestToApi;

module.exports = exports = {
  getBrokenPlugs: function ( req, res ) {
    var broken = [];
    // find all the plugs where there is an omnimeter and the meter status is error
    plug.findAll( { where: { meter_status: 'error', ekm_omnimeter_serial: { $ne: null } } } )
    .then(function( plugs ) {
      //for each one of the plugs
      async.each(plugs, function( plug, cb ) {
        var data = {
          kin: null,
          location: null,
          location_address: null,
          network: null,
          ekm_omnimeter_serial: plug.ekm_omnimeter_serial,
          ekm_push_mac: null,
          number_on_station: plug.number_on_station
        };
        // get the station
        station.find( { where: { id: plug.station_id } } )
        .then(function( stationAssociatedWithPlug ) {
          data.kin = stationAssociatedWithPlug.kin;
          data.location = stationAssociatedWithPlug.location;
          data.location_address = stationAssociatedWithPlug.location_address;
          data.network = stationAssociatedWithPlug.network;
          data.ekm_push_mac = stationAssociatedWithPlug.ekm_push_mac;

          broken.push( data );
          cb( null );
        })
        .catch(function( error ) {
          cb( error );
        });
      }, function( error ) {
        if ( error ) {
          throw Error( error );
        } else {
          broken.sort(function( a, b ) {
            if ( a.kin.toLowerCase() < b.kin.toLowerCase() ) {
              return -1;
            } else {
              return 1;
            }
          });
          res.send( broken );
        }
      });
    })
    .catch(function( error ) {
      res.status( 500 ).send( error );
    });
  },
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
          apiRequest("http://io.ekmpush.com/readMeter/v3/key/" + config.ekmApiKey + "/count/1/format/json/meters/" + plug.ekm_omnimeter_serial)
          .then(function( data ) {
            khw += data.readMeter.ReadSet[ 0 ].ReadData[ 0 ].kWh_Tot;
            cb(null);
          })
          .catch(function( error ) {
            cb(error);
          })
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
        })
      } else {
        res.status( 404 ).send();
      }
    })
    .catch(function( error ) {
      res.status( 500 ).send(error);
    });
  }
};

















