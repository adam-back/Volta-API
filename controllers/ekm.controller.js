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
    request( 'http://summary.ekmpush.com/summary?meters=' + req.url.substring( 1 ) + '&key=' + APIkey + '&report=dy&format=json&offset=0&limit=1', function( error, response, body ) {

      // API does not send back a real error if the arguements are incorrect
      // It send back a body which explains the call paramenters, starting with
      // the word 'Error'. So, check if no real error has been sent and
      // for the error page before doing anything to the database.
      if ( !error && body[0] !== 'E' ) {
        // serve JSON data to client
        res.send(JSON.parse(body)[0]);
        // save it in the database
        EKMreading.create( JSON.parse( body )[ 0 ] )
          .then(function( reading ) {
            console.log( 'Saved EKM reading.' );

            Station.find( { where: { ekmOmnimeterSerial: reading.Meter } } )
              .then(function( station ) {
                // Connect with foreign key
                station.addReading( reading )
                  .then(function() {
                    console.log( 'Connected reading to station.' );
                  })
                  .catch(function( err ) {
                    console.error( 'Error setting reading to station:', err );
                  });
              })
              .catch(function( err) {
                console.error( 'Error finding station:', err );
              });

          })
          .catch(function( error ) {
            console.error( 'Error saving EKM reading:', error );
          });
      } else {
        // Wrong Omnimeter S/N Number
        res.send( 'I\'m sorry, but data for the station with Omnimeter S\\N ' + req.url.substring( 1 ) + ', could not be found.' );
      }
    });
  }
};