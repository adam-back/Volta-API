var request = require( 'request' );
var station = require( '../models').station;
var plug = require( '../models').plug;
var charge_event = require( '../models').charge_event;
var express = require( 'express' );
var io = require('../server').io;
var async = require( 'async' );
var querystring = require('querystring');

module.exports = exports = {
  getAllStations: function ( req, res ) {

    // query database for all rows of stations
    station.findAll()
      .then(function( stations ) {
        // respond json with all data
        res.json( stations );
      })
      .catch(function( error ) {
        res.status( 500 ).send( error );
      });
  },
  getOneStation: function ( req, res ) {
    // query database for all rows of stations
    station.findOne( { where: { kin: req.params.kin } } )
      .then(function( oneStation ) {
        // if found
        if( oneStation ) {
          res.json( oneStation );
        } else {
          res.status( 404 ).send( 'A station with that KIN was not found.' );
        }
      })
      .catch(function( error ) {
        res.status( 500 ).send( error );
      });
  },
  getStationsByNetwork: function ( req, res ) {
    // query database for all rows of stations
    station.findAll( { where: { network: req.params.network } } )
      .then(function( stations ) {
        // if found
        if( stations.length === 0 ) {
          res.status( 404 ).send('That region was not found. Please try '+
                                    'Arizona, ' +
                                    'Hawaii, ' +
                                    'Chicago, ' +
                                    'NoCal for Northern California, ' +
                                    'LA for Los Angeles, ' +
                                    'SD for San Diego, ' +
                                    'or SB for Santa Barbara Area.'
                                  );
        } else {
          res.json( stations );
        }
      })
      .catch(function( error ) {
        res.status( 500 ).send( error );
      });
  },
  addStation: function (req, res) {
    newStation = req.body;
    station.findOrCreate( { where: { kin: newStation.kin }, defaults: newStation } )
    .spread(function( station, created ) {
      res.json( { successfullyAddedStation: created } );
    });
  },
  deleteStation: function (req, res) {
    // also deletes associated plugs
    station.find( { where: { kin: req.url.substring(1) } } )
    .then(function( station ) {
      // if there is a station with that kin
      if ( station ) {
        // get its plugs
        return station.getPlugs()
        .then(function( plugs ) {
          if( plugs ) {
            // destroy each plug
            return async.each( plugs, function( plug, cb ) {
              plug.destroy()
              .then(function( removedPlug ) {
                cb( null );
              })
              .catch(function( error ) {
                cb( error );
              });
            }, function( error ) {
              // if error destroying plug
              if( error ) {
                throw error;
              } else {
                return void( 0 );
              }
            });
          }
        })
        .then(function() {
          station.destroy()
          .then(function() {
            res.status( 204 ).send();
          });
        });
      // a station with that kin could not be found
      } else {
        res.status( 404 ).send( 'Station with that KIN not found in database. Could not be deleted.' );
      }
    })
    .catch(function( error ) {
      res.status( 500 ).send( 'Error deleting station: ' + error );
    });
  },
  //Kill switch - DO NOT CHANGE!
  setStationStatus: function (req, res) {
    if ( !io ) {
      var io = require( '../server' ).io;
    }

    io.sockets.emit( req.params.kin, { status: req.body } );
    setOneStation(req, res);
  },
  updateStation: function ( req, res ) {
    // object looks like:
    // { kin: #, changes: [ [ field, old, new ], [ field, old, new ] ] }
    station.find( { where: { kin: req.body.kin } } )
      .then(function( stationToUpdate ) {
        for ( var i = 0; i < req.body.changes.length; i++ ) {
          var field = req.body.changes[ i ][ 0 ];
          var newData = req.body.changes[ i ][ 2 ];
          stationToUpdate[ field ] = newData;
        }

        stationToUpdate.save()
          .then(function( successStation ) {
            res.json( successStation );
          })
          .catch(function( error ) {
            var query = {};
            // get the title that of the colum that errored
            var errorColumn = Object.keys( error.fields );
            // get the value that errored
            var duplicateValue = error.fields[ errorColumn ];
            query[ errorColumn ] = duplicateValue;

            // where conflicting key, value
            Station.find( { where: query } )
              .then(function( duplicateStation ) {
                error.duplicateStation = duplicateStation;
                // 409 = conflict
                res.status( 409 ).send( error );
              })
              .catch(function( error ) {
                res.status( 500 ).send( error );
              });
          });
      })
      .catch(function( error ) {
        res.status( 404 ).send( error );
      })

    // if body contains on and off times
    // parse the times based on the stations location
    // and save the UTC times in a list
  },
  getTopTenStations: function( req, res ) {
    station.findAll( { limit: 10, order: 'cumulative_kwh DESC'} )
    .then(function( stationsInOrder ) {
      var stationsAndPlugs  = {
        stations: {},
        plugs: {},
        events: {}
      };

      async.each(stationsInOrder, function( station, cb ) {
        var order = stationsInOrder.indexOf( station );
        station.getPlugs()
        .then(function( plugs ) {
          stationsAndPlugs.stations[ order ] = station;
          stationsAndPlugs.plugs[ order ] = plugs;
          stationsAndPlugs.events[ order ] = {};
          // count the number of total charge events
          return charge_event.count( { where: { station_id: station.id } } );
        })
        .then(function( countOfEvents ) {
          stationsAndPlugs.events[ order ].count = countOfEvents;
          // add total kWh
          return charge_event.sum('kwh', { where: { station_id: station.id, time_stop: { $ne: null } } } );
        })
        .then(function( totalKWH ) {
          stationsAndPlugs.events[ order ].cumulative_kwh = totalKWH;
          // right now
          var sevenDaysAgo = new Date();
          // roll back the day 6 times, which is inclusive of today
          sevenDaysAgo.setDate( sevenDaysAgo.getDate() - 6 );
          // make it the start of the day, UTC +7, ignorin DST
          sevenDaysAgo.setHours( 7 );
          sevenDaysAgo.setMinutes( 0 );
          sevenDaysAgo.setSeconds( 0 );
          sevenDaysAgo.setMilliseconds( 0 );
          return charge_event.findAll( { where: { station_id: station.id, time_stop: { $ne: null }, time_start: { $gt: sevenDaysAgo } }, order: 'time_start' } );
        })
        .then(function( weekReport ) {
          // create a data set for the graph
          var days = [];
          var plugIns = [];
          var kwhGiven = [];
          var dayIndex = -1;
          var currentDay;

          // sort the report into days
          for ( var i = 0; i < weekReport.length; i++ ) {
            // if we're still on the same day
            if ( currentDay === weekReport[ i ].time_start.getDate() ) {
              // this is a charge event to count, increase it
              plugIns[ dayIndex ]++;
              kwhGiven[ dayIndex ] += +weekReport[ i ].kwh;
            // new day
            } else {
              currentDay = weekReport[ i ].time_start.getDate();
              days.push( ( weekReport[ i ].time_start.getMonth() + 1 ) + '/' + currentDay );
              dayIndex++;
              plugIns.push( 1 );
              kwhGiven.push( +weekReport[ i ].kwh );
            }
          }

          // round to nearest tenths
          for ( var i = 0; i < kwhGiven.length; i++ ) {
            kwhGiven[ i ] = Math.round( 10 * kwhGiven[ i ] ) / 10;
          }

          stationsAndPlugs.events[ order ].days = days;
          stationsAndPlugs.events[ order ].plugIns = plugIns;
          stationsAndPlugs.events[ order ].kwhGiven = kwhGiven;

          cb( null );
        })
        .catch(function( error ) {
          cb( error );
        });
      }, function( error ) {
        if ( error ) {
          throw error;
        } else {
          res.json( stationsAndPlugs );
        }
      });
    })
    .catch(function( error ) {
      res.status( 500 ).send( error );
    });
  },
  getCumulativeData: function( req, res ) {
    var data = {
      plugIns: 0,
      kwhGiven: 0,
      graphs: {}
    };

    // count the number of total charge events
    charge_event.count()
    .then(function( number ) {
      data.plugIns = number;
      // add the kwh of those charge events
      return charge_event.sum('kwh', { where: { time_stop: { $ne: null } } } );
    })
    .then(function( totalKWH ) {
      // right now
      var sevenDaysAgo = new Date();
      // roll back the day 6 times, which is inclusive of today
      sevenDaysAgo.setDate( sevenDaysAgo.getDate() - 6 );
      // make it the start of the day, UTC +7, ignorin DST
      sevenDaysAgo.setHours( 7 );
      sevenDaysAgo.setMinutes( 0 );
      sevenDaysAgo.setSeconds( 0 );
      sevenDaysAgo.setMilliseconds( 0 );
      data.kwhGiven = totalKWH;
      // get the charge events from the last seven days
      return charge_event.findAll( { where: { time_stop: { $ne: null }, time_start: { $gt: sevenDaysAgo } }, order: 'time_start' } );
    })
    .then(function( charges ) {
      // create a data set for the graph
      var days = [];
      var plugIns = [];
      var kwhGiven = [];
      var dayIndex = -1;
      var currentDay;

      // sort the report into days
      for ( var i = 0; i < charges.length; i++ ) {
        // if we're still on the same day
        if ( currentDay === charges[ i ].time_start.getDate() ) {
          // this is a charge event to count, increase it
          plugIns[ dayIndex ]++;
          kwhGiven[ dayIndex ] += +charges[ i ].kwh;
        // new day
        } else {
          currentDay = charges[ i ].time_start.getDate();
          days.push( ( charges[ i ].time_start.getMonth() + 1 ) + '/' + currentDay );
          dayIndex++;
          plugIns.push( 1 );
          kwhGiven.push( +charges[ i ].kwh );
        }
      }

      // round to nearest tenths
      for ( var i = 0; i < kwhGiven.length; i++ ) {
        kwhGiven[ i ] = Math.round( 10 * kwhGiven[ i ] ) / 10;
      }

      data.graphs.days = days;
      data.graphs.plugIns = plugIns;
      data.graphs.kwhGiven = kwhGiven;
      res.json( data );
    })
    .catch(function( error ) {
      console.log( error );
      res.status( 500 ).send( error );
    });
  }
};