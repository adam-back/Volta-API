var express = require( 'express' );
var router = express.Router();
var controller = require( '../controllers/plug.controller.js' );

// for http://www.baseurl.com/plugs/
router.route( '/' )
  .get( controller.getAllPlugs );

router.route( '/:id' )
  .get( controller.getOnePlug );

module.exports = router;
