var request = require( 'request' );
var EKMreading = require( '../models').EKMreading;
var Station = require( '../models').Station;
var express = require( 'express' );
var APIkey;

if( process.env.APIkey ) {
  APIkey = process.env.APIkey;
} else {
  APIkey = require( '../private.js' ).APIkey;
}

module.exports = exports = {
  writeEKMDataById: function (req, res) {
     // get data from API
    request( 'http://summary.ekmpush.com/summary?meters=' + req.url.substring(1) + '&key=' + APIkey + '&report=dy&format=json&offset=0&limit=1', function( error, response, body ) {
      // serve it
      res.send(JSON.parse(body)[0]);

      if ( !error ) {
        // save it
        EKMreading.create(JSON.parse(body)[0])
          .then(function( reading ) {
            console.log( 'Saved EKM reading.' );

            Station.find({where: {ekmOmnimeterSerial: reading.Meter}})
              .then(function(station) {
                console.log('Found station', station);
                // reading.setKIN( station.kin );
                station.addReading( reading )
                  .then(function() {
                    console.log('Made relationship.');
                  })
              })

          })
          .catch(function( error ) {
            console.error( 'Error saving EKM reading:', error );
          });
      }
    });
  }
};