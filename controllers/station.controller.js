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
        if( oneStation.length === 0 ) {
          res.status( 404 ).send('<p>A station with that KIN was not found.</p>')
        } else {
          res.json( oneStation );
        }
      })
      .catch(function( error ) {
        res.status( 500 ).send( error );
      });
  },
  getStationsByNetwork: function (req, res) {
     
    // query database for all rows of stations
    Station.findAll( { where: { network: req.params.network } } )
      .then(function( stations ) {
        // if found
        if( stations.length === 0 ) {
          res.status( 404 ).send('<p>That region was not found. Please try:</p>'+
                                  '<ul>' +
                                    '<li>Arizona</li>' +
                                    '<li>Hawaii</li>' +
                                    '<li>Chicago</li>' +
                                    '<li><b>NoCal</b> for Northern California</li>' +
                                    '<li><b>LA</b> for Los Angeles</li>' +
                                    '<li><b>SD</b> for San Diego</li>' +
                                    '<li><b>SB</b> for Santa Barbara Area</li>' +
                                  '</ul>');
        } else {
          res.json( stations );
        }
      })
      .catch(function( error ) {
        res.status( 500 ).send( error );
      });
  }
};