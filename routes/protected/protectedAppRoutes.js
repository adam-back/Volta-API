var express = require( 'express' );
var router = express.Router();
var controller = require( '../../controllers/protected/app.protectedController.js' );

// for http://www.baseurl.com/protected/app/stations
router.route( '/stations' )
  .get( controller.getStationsAndPlugs );

// for http://www.baseurl.com/protected/app/stationReport
router.route( '/stationReport' )
  .post( controller.saveReport );

// for http://www.baseurl.com/protected/app/sponsors
router.route( '/sponsors' )
  .get( controller.getAppSponsors );

module.exports = router;