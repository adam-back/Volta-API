var express = require( 'express' );
var router = express.Router();
var controller = require( '../controllers/station.controller.js' );

// for http://www.baseurl.com/stations/
router.route( '/' )
  .get( controller.getAllStations );

// for http://www.baseurl.com/stations/KIN
router.route( '/:kin' )
  .get( controller.getOneStation );

router.route( '/:kin' )
  .put( controller.setOneStation );

router.route( '/network/:network' )
  .get( controller.getStationsByNetwork );

module.exports = router;
