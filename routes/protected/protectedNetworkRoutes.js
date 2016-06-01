var express = require( 'express' );
var router = express.Router();
var controller = require( '../../controllers/protected/network.protectedController.js' );

// for http://www.baseurl.com/protected/station/network/map
router.route( '/map' )
  .get( controller.getNetworkMapData );

module.exports = router;