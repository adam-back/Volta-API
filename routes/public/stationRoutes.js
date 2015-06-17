var express = require( 'express' );
var router = express.Router();
var controller = require( '../../controllers/public/station.controller.js' );

// for http://www.baseurl.com/stations
router.route( '/' )
  .get( controller.getAllStations );

// for http://www.baseurl.com/stations/001-0001-001-01-K
// For Kill Switch, DO NOT TOUCH
router.route( '/:kin' )
  .put( controller.setStationStatus );

// for http://www.baseurl.com/stations/top10
router.route( '/top10' )
  .get( controller.getTopTenStations );

// for http://www.baseurl.com/stations/cumulative
router.route( '/cumulative' )
  .get( controller.getCumulativeData );

module.exports = router;
