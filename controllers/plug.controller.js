var request = require( 'request' );
var plug = require( '../models').plug;
var express = require( 'express' );

module.exports = exports = {
  getAllPlugs: function ( req, res ) {
    // query database for all rows of plugs
    plug.findAll()
    .then(function( plugs ) {
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
  },
  getOnePlug: function ( req, res ) {
    // query database for a plug with a certain station_id
    plug.findOne( { where: { station_id: req.params.id } } )
    .then(function( plugs ) {
      // if found
      if( !plugs ) {
        res.status( 404 ).send( '<p><strong>404</strong></p><p>A plug associated with that station id was not found.</p>' );
      } else {
        res.json( plugs );
      }
    })
    .catch(function( error ) {
      res.status( 500 ).send( error );
    });
  }
};