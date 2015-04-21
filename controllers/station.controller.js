var request = require( 'request' );
var Station = require( '../models').Station;
var express = require( 'express' );

module.exports = exports = {
  getAllStations: function (req, res) {
     
    // query database for all rows of stations
    Station.findAll()
      .then(function( stations ) {
        // respond json with all data
        res.json( stations );
      })
      .catch(function( error ) {
        res.status( 500 ).send( error );
      });
  },
  getOneStation: function (req, res) {
     
    // query database for all rows of stations
    Station.findOne( { where: { kin: req.params.kin } } )
      .then(function( oneStation ) {
        // if found
        if( !oneStation ) {
          res.status( 404 ).send('<p>A station with that KIN was not found.</p>')
        } else {
          res.json( oneStation );
        }
      })
      .catch(function( error ) {
        res.status( 500 ).send( error );
      });
  },
};