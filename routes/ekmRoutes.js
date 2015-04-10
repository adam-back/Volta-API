var express = require('express');
var router = express.Router();

// for ekm/

router.route( '/' )
  .get(function( req, res ) {
    res.send( 'You\'ve reached ' + req.url + '.' );
  });

router.route( '/:id' )
  .get(function( req, res ) {
    res.send( 'You\'ve reached ' + req.url + '.' )
  });

module.exports = router;
