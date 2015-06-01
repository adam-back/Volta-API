var request = require( 'request' );
var plug = require( '../models').plug;
var express = require( 'express' );

module.exports = exports = {
  getAllPlugs: function ( req, res ) {
    // query database for all rows of stations
    plug.findAll()
    .then(function( plugs ) {
      // respond json with all data
      var orderedByStation = {};
      for ( var i = 0; i < plugs.length; i++ ) {
        var stationId = plugs[ i ].station_id;

        // if the station already has a plug
        if ( orderedByStation[ stationId ] ) {
          // add to it
          orderedByStation[ stationId ].push( plugs[ i ] );
        // if it isn't added yet
        } else {
          // start it
          orderedByStation[ stationId ] = [ plugs[ i ] ];
        }
      }
      res.json( orderedByStation );
    })
    .catch(function( error ) {
      res.status( 500 ).send( error );
    });
  }
};