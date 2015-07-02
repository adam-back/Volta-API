var request = require( 'request' );
var station = require( '../../models').station;
var express = require( 'express' );
var async     = require( 'async' );

module.exports = exports = {
  getStationsAndPlugs: function ( req, res ) {
    var stationsAndPlugs = [];

    // get all stations
    station.findAll()
    .then(function( stations ) {
      // for each station
      async.each( stations, function( station, cb ) {
        // get only the values of the station
        var plainStation = station.get( { plain: true } );
        // get the associated plugs for the station
        station.getPlugs()
        .then(function( plugs ) {
          // if there are plugs, i.e. push and cloudgate installed
          if ( plugs && plugs.length > 0 ) {
            // create a plugs field on the station
            plainStation.plugs = [];
            // for each plug on the station
            for ( var i = 0; i < plugs.length; i++ ) {
              // push the values of plug to the plugs array on station
              plainStation.plugs[ plugs[ i ].number_on_station - 1 ] = plugs[ i ].get( { plain: true } );
            }
          // station not metered, no plugs
          } else {
            plainStation.plugs = null;
          }

          stationsAndPlugs.push( plainStation );
          cb( null );
        })
        .catch(function( error ) {
          cb( error );
        });
      }, function( error ) {
        if ( error ) {
          res.status( 500 ).send( error );
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