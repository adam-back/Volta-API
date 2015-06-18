var request = require( 'request' );
var station = require( '../../models' ).station;
var plug = require( '../../models' ).plug;
var charge_event = require( '../../models').charge_event;
var express = require( 'express' );
var io = require( '../../server' ).io;
var async = require( 'async' );
var querystring = require( 'querystring' );

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
  getOneStation: function( req, res ) {
    // query database for all rows of stations
    station.findOne( { where: { kin: req.url.substring(1) } } )
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
  //Kill switch - DO NOT CHANGE!
  setStationStatus: function (req, res) {
    if ( !io ) {
      var io = require( '../server' ).io;
    }

    io.sockets.emit( req.params.kin, { status: req.body } );
    station.update( req.body, { where: { kin: req.params.kin } } );
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