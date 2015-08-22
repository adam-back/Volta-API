var station = require( '../../models').station;
var plug = require( '../../models').plug;
var express = require( 'express' );
var async     = require( 'async' );
var Q = require( 'q' );
var env = process.env.NODE_ENV || 'development';
var config    = require( '../../config/config' )[ env ];

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
  }
};