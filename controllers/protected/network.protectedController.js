var model = require( '../../models' );
var async = require( 'async' );
var Q = require( 'q' );
var moment = require('moment');
moment().format();
var factory = require( '../../factories/reports/networkMapData.js' );

module.exports = exports = {

  getNetworkMapData: function( req, res ) {
    var sevenDaysAgo = moment.utc().startOf( 'day' ).subtract( 7, 'days' );

    var stationPromise = model.station.findAll( { attributes: [ 'id', 'network', 'cumulative_kwh' ], raw: true } );
    // SELECT *
    // FROM charge_events
    // WHERE ( time_start > sevenDays Ago AND time_start < today ) AND time_stop IS NOT NULL
    // ORDER BY time_start
    var chargeEventPromise = model.charge_event.findAll( { where: { time_start: { $gt: sevenDaysAgo.format(), $lt: moment.utc().startOf( 'day' ).format() }, time_stop: { $ne: null } }, order: 'time_start', raw: true } );

    Q.all( [ stationPromise, chargeEventPromise ] )
    .spread(function( stations, chargeEvents ) {
      var uniqueNetworks = {};
      var networkLookupByStation = {};
      var networkCumulatives = {
        all: 0
      };

      // make the networks of stations easier to find
      var numberOfStations = stations.length;
      for ( var i = 0; i < numberOfStations; i++ ) {
        var oneStation = stations[ i ];

        // if a network is specified
        if ( oneStation.network ) {
          uniqueNetworks[ oneStation.network ] = true;
          networkLookupByStation[ oneStation.id ] = oneStation.network;

          // if there is no accumulator yet
          if ( networkCumulatives.hasOwnProperty( oneStation.network ) === false ) {
            // add one
            networkCumulatives[ oneStation.network ] = 0;
          }

          var kWh = Number( oneStation.cumulative_kwh );
          if( Number.isNaN( kWh ) === false ) {
            // add cumulative kWh
            networkCumulatives[ oneStation.network ] += kWh;
            networkCumulatives.all += kWh;
          }

        }
      }

      var formattedGraphData = factory.aggregateNetworkMapData( chargeEvents, networkLookupByStation, uniqueNetworks );

      // count all
      var countPromises = [ model.charge_event.count() ];

      // console.log( 'countPromises', countPromises );
      // count for specific networks
      for ( var key in networkCumulatives ) {
        if ( key !== 'all' ) {
          countPromises.push( factory.countChargeEventsForNetwork( key ) );
        }
      }

      return Q.all( countPromises )
      .then(function( counts ) {
        // format total count
        counts[ 0 ] = [ 'all', counts[ 0 ] ];

        var numberOfCounts = counts.length;
        for ( var j = 0; j < numberOfCounts; j++ ) {
          var network = counts[ j ][ 0 ];
          var count = counts[ j ][ 1 ];

          // add the counts to the cumulative object
          formattedGraphData[ network ].totalChargeEvents = count;
          // round to nearest ones
          formattedGraphData[ network ].cumulativeKwh = Number( networkCumulatives[ network ].toFixed( 0 ) );
        }

        res.json( formattedGraphData );
      });
    })
    .catch(function( error ) {
      res.status( 500 ).send( error.message );
    });
  }
};