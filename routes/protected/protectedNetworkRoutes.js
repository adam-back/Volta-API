var express = require( 'express' );
var router = express.Router();
var controller = require( '../../controllers/protected/network.protectedController.js' );

// for http://www.baseurl.com/protected/station/network/Arizona
router.route( '/:network' )
  .get( controller.getStationsByNetwork );

module.exports = router;