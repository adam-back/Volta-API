var express = require( 'express' );
var router = express.Router();
var controller = require( '../../controllers/protected/reports.protectedController.js' );

// for http://www.baseurl.com/protected/reports/broken
router.route( '/broken' )
  .get( controller.getBrokenPlugs );

// for http://www.baseurl.com/protected/reports/one/123-1234-123-01-k
router.route( '/one/:kin' )
  .get( controller.getOneStationAnalytics );

// for http://www.baseurl.com/protected/reports/wrongCoordinates
router.route( '/wrongCoordinates' )
  .get( controller.getMismatchedStationCoordinates );

module.exports = router;