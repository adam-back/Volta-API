var express = require( 'express' );
var router = express.Router();
var controller = require( '../controllers/station.controller.js' );

// for http://www.baseurl.com/stations/
router.route( '/' )
  .get( controller.getAllStations );

router.route( '/top10' )
  .get( controller.getTopTenStations );

router.route( '/cumulative' )
  .get( controller.getCumulativeData );

// for http://www.baseurl.com/stations/KIN
router.route( '/:kin' )
  .get( controller.getOneStation )
  .patch( controller.updateStation )
  //Kill switch - DO NOT CHANGE!
	.put( controller.setStationStatus )
	.post( controller.addStation )
	.delete( controller.deleteStation );

router.route( '/network/:network' )
  .get( controller.getStationsByNetwork );

module.exports = router;
