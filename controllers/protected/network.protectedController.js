var request = require( 'request' );
var station = require( '../../models').station;
var plug = require( '../../models').plug;
var charge_event = require( '../../models').charge_event;
var async = require( 'async' );
var express = require( 'express' );
var moment = require('moment');
moment().format();

module.exports = exports = {
  getTopTenStations: function( req, res ) {
    station.findAll( { where: { cumulative_kwh: { $ne: null } } }, { limit: 10, order: 'cumulative_kwh DESC'} )
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
          stationsAndPlugs.events[ order ].cumulative_kwh = station.cumulative_kwh;
          var sevenDaysAgo = moment().subtract( 7, 'days' );
          sevenDaysAgo.startOf( 'day' );
          return charge_event.findAll( { where: { station_id: station.id, time_stop: { $ne: null }, time_start: { $gt: sevenDaysAgo.toDate() } }, order: 'time_start' } );
        })
        .then(function( charges ) {
          // create a data set for the graph
          var days = [];
          var plugIns = [];
          var kwhGiven = [];
          var dayIndex = 0;
          // start values
          var currentDay = moment( charges[ 0 ].time_start );
          days.push( moment( charges[ 0 ].time_start ).format( 'M[/]D') );
          plugIns[ dayIndex ] = 1;
          kwhGiven[ dayIndex ] = +charges[ 0 ].kwh;

          // sort the report into days
          for ( var i = 1; i < charges.length; i++ ) {
            var chargeTime = moment( charges[ i ].time_start );
            // if we're still on the same day
            if ( chargeTime.isSame( currentDay, 'day' ) ) {
              // this is a charge event to count, increase it
              plugIns[ dayIndex ]++;
              kwhGiven[ dayIndex ] += +charges[ i ].kwh;
            // new day
            } else {
              currentDay = moment( charges[ i ].time_start );
              days.push( moment( charges[ i ].time_start ).format( 'MMM[/]D') );
              dayIndex++;
              plugIns.push( 1 );
              kwhGiven.push( +charges[ i ].kwh );
            }
          }

          // round to nearest tenths
          for ( var i = 0; i < kwhGiven.length; i++ ) {
            kwhGiven[ i ] = Number( kwhGiven[ i ].toFixed( 1 ) );
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
      return station.sum( 'cumulative_kwh' );
    })
    .then(function( totalKWH ) {
      data.kwhGiven = totalKWH;
      var sevenDaysAgo = moment().subtract( 7, 'days' );
      // set to start of day seven days ago
      sevenDaysAgo.startOf( 'day' );
      // get the charge events from the last seven days
      return charge_event.findAll( { where: { time_stop: { $ne: null }, time_start: { $gt: sevenDaysAgo.toDate() } }, order: 'time_start', raw: true } );
    })
    .then(function( charges ) {
      // create a data set for the graph
      var days = [];
      var plugIns = [];
      var kwhGiven = [];
      var dayIndex = 0;
      // start values
      var currentDay = moment( charges[ 0 ].time_start );
      days.push( moment( charges[ 0 ].time_start ).format( 'M[/]D') );
      plugIns[ dayIndex ] = 1;
      kwhGiven[ dayIndex ] = +charges[ 0 ].kwh;

      // sort the report into days
      for ( var i = 1; i < charges.length; i++ ) {
        var chargeTime = moment( charges[ i ].time_start );
        // if we're still on the same day
        if ( chargeTime.isSame( currentDay, 'day' ) ) {
          // this is a charge event to count, increase it
          plugIns[ dayIndex ]++;
          kwhGiven[ dayIndex ] += +charges[ i ].kwh;
        // new day
        } else {
          currentDay = moment( charges[ i ].time_start );
          days.push( moment( charges[ i ].time_start ).format( 'MMM[/]D') );
          dayIndex++;
          plugIns.push( 1 );
          kwhGiven.push( +charges[ i ].kwh );
        }
      }

      // round to nearest tenths
      for ( var i = 0; i < kwhGiven.length; i++ ) {
        kwhGiven[ i ] = Number( kwhGiven[ i ].toFixed( 1 ) );
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
  }
};