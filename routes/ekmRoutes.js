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

module.exports = router;
