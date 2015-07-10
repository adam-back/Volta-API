var express = require( 'express' );
var router = express.Router();
var controller = require( '../../controllers/public/stationSchedules.controller.js' );

// for http://www.baseurl.com/stations
router.route( '/' )
  .get( controller.getAllSchedules );

// for http://www.baseurl.com/stations/001-0001-001-01-K
// For Kill Switch, DO NOT TOUCH
router.route( '/:kin' )
  .put( controller.setSchedule )
  .get( controller.getSchedule );

module.exports = router;
