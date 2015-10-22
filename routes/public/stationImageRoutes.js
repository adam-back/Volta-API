var express = require( 'express' );
var router = express.Router();
var controller = require( '../../controllers/public/stationImage.controller.js' );

// for http://www.baseurl.com/stationImages
router.route( '/' )
  .get( controller.connectStationImages );

module.exports = router;
