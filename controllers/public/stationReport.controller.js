var request = require( 'request' );
var station_report = require( '../../models' ).station_report;
var express = require( 'express' );

module.exports = exports = {
  saveReport: function ( req, res ) {
    station_report.create( req.body )
    .then(function( success ) {
      res.status( 204 ).send(); // needs to be this for iOS app
    })
    .catch(function( error ) {
      res.status( 500 ).send( error );
    });
  }
};