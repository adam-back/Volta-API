var station = require( '../../models' ).station;
var express = require( 'express' );
var aws = require( '../../factories/awsFactory' );

module.exports = exports = {
  connectStationImages: function ( req, res ) {
    aws.addS3ImagesToDatabase()
    .then(function() {
      // respond json with all data
      res.json( 'Success' );
    })
    .catch(function( error ) {
      res.status( 500 ).send( error );
    });
  }
};