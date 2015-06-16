var request = require( 'request' );
var station = require( '../../models').station;
var express = require( 'express' );

module.exports = exports = {
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