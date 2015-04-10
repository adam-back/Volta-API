var express = require('express');
var router = express.Router();
var request = require('request');
var APIkey;

if( process.env.APIkey ) {
  APIkey = process.env.APIkey;
} else {
  APIkey = require( '../private.js' ).APIkey;
}

// for ekm/
router.route( '/' )
  .get(function( req, res ) {
    res.send( 'You\'ve reached ' + req.url + '.' );
  });

router.route( '/:id' )
  .get(function( req, res ) {
    // get data
    request( 'http://summary.ekmpush.com/summary?meters=' + req.url.substring(1) + '&key=' + APIkey + '&report=dy&format=json&offset=0&limit=1', function( error, response, body ) {
      // serve it
      res.send( body );
      // write it to database
    });

    // TODO:
    // check the database for a matching entry
      // if it returns
        // serve it
      // if it isn't downloaded yet
        // put it in the queue to download
  });

module.exports = router;
