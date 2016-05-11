var station = require( '../../models').station;
var plug = require( '../../models').plug;
var model = require( '../../models' );
var charge_event = require( '../../models').charge_event;
var async = require( 'async' );
var Q = require( 'q' );
var moment = require('moment');
moment().format();
var factory = require( '../../factories/reports/networkMapData.js' );

module.exports = exports = {

  getNetworkMapData: function( req, res ) {
    var sevenDaysAgo = moment.utc().startOf( 'day' ).subtract( 7, 'days' );

    var stationPromise = model.station.findAll( { attributes: [ 'id', 'network' ], raw: true } );
    // SELECT *
    // FROM charge_events
    // WHERE ( time_start > sevenDays Ago AND time_start < today ) AND time_stop IS NOT NULL
    // ORDER BY time_start
    var chargeEventPromise = model.charge_event.findAll( { where: { time_start: { $gt: sevenDaysAgo.format(), $lt: moment.utc().startOf( 'day' ).format() }, time_stop: { $ne: null } }, order: 'time_start', raw: true } );

    Q.all( [ stationPromise, chargeEventPromise ] )
    .spread(function( stations, chargeEvents ) {
      var uniqueNetworks = {};
      var networkLookupByStation = {};

      // make the networks of stations easier to find
      var numberOfStations = stations.length;
      for ( var   i = 0; i < numberOfStations; i++ ) {
        var oneStation = stations[ i ];

        if ( oneStation.network ) {
          uniqueNetworks[ oneStation.network ] = true;
          networkLookupByStation[ oneStation.id ] = oneStation.network;
        }
      }

      var formattedGraphData = factory.aggregateNetworkMapData( chargeEvents, networkLookupByStation, uniqueNetworks );
      res.json( formattedGraphData );
    })
    .catch(function( error ) {
      res.status( 500 ).send( error.message );
    });
  }
};