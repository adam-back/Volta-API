var express = require( 'express' );
var router = express.Router();
var controller = require( '../controllers/ekm.controller.js' );

// for http://www.baseurl.com/ekm
router.route( '/' )
  .get(function( req, res ) {
    res.send( 'You\'ve reached ' + req.url + '.' );
  });

router.route( '/:id' )
  .get( controller.writeEKMDataById );

    // TODO:
    // check the database for a matching entry
      // if it returns
        // serve it
      // if it isn't downloaded yet
        // put it in the queue to download

module.exports = router;
