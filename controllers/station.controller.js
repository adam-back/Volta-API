var request = require( 'request' );
var station = require( '../models').station;
var plug = require( '../models').plug;
var charge_event = require( '../models').charge_event;
var express = require( 'express' );
var io = require('../server').io;
var async = require( 'async' );

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
        if( oneStation.length === 0 ) {
          res.status( 404 ).send( '<p>A station with that KIN was not found.</p>' );
        } else {
          res.json( oneStation );
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
          res.status( 404 ).send('<p>That region was not found. Please try:</p>'+
                                  '<ul>' +
                                    '<li>Arizona</li>' +
                                    '<li>Hawaii</li>' +
                                    '<li>Chicago</li>' +
                                    '<li><b>NoCal</b> for Northern California</li>' +
                                    '<li><b>LA</b> for Los Angeles</li>' +
                                    '<li><b>SD</b> for San Diego</li>' +
                                    '<li><b>SB</b> for Santa Barbara Area</li>' +
                                  '</ul>');
        } else {
          res.json( stations );
        }
      })
      .catch(function( error ) {
        res.status( 500 ).send( error );
      });
  },
  setOneStation: function ( req, res ) {
    station.update( req.body, { where: { kin: req.params.kin } } );

    if ( !io ) {
      var io = require( '../server' ).io;
    }

    io.sockets.emit( req.params.kin, { status: req.body } );
    res.json( 'Update Complete' );
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
          var sevenDaysAgo = new Date();
          sevenDaysAgo.setDate( sevenDaysAgo.getDate() - 6 );
          // get the charge events for the last sevent days, ordered from oldest to newest
          return charge_event.findAll( { where: { station_id: station.id, time_stop: { $ne: null }, time_start: { $gt: sevenDaysAgo } }, order: 'time_start' } );
        })
        .then(function( weekReport ) {
          var days = [];
          var dayIndex = -1;
          var currentDay;

          // sort the report into days
          for ( var i = 0; i < weekReport.length; i++ ) {
            // if we're still on the same day
            if ( currentDay === weekReport[ i ].time_start.getDate() ) {
              // this is a charge event to count, increase it
              days[ dayIndex ][ 1 ]++;
            // new day
            } else {
              currentDay = weekReport[ i ].time_start.getDate();
              dayIndex++;
              // note that the time is a timestamp
              days.push( [ weekReport[ i ].time_start.getTime(), 1 ] );
            }
          }

          stationsAndPlugs.events[ order ].data = days;
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
  }
};