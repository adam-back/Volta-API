var express = require( 'express' );
var router = express.Router();
var controller = require( '../../controllers/protected/reports.protectedController.js' );

// for http://www.baseurl.com/protected/reports/dashboard
router.route( '/dashboard' )
  .get( controller.getDashboardData );

// for http://www.baseurl.com/protected/reports/broken/web
router.route( '/broken/:output' )
  .get( controller.getBrokenPlugs );

// for http://www.baseurl.com/protected/reports/one/123-1234-123-01-k
router.route( '/one/:kin' )
  .get( controller.getOneStationAnalytics );

// for http://www.baseurl.com/protected/reports/withoutCoordinates/csv
router.route( '/withoutCoordinates/:output' )
  .get( controller.getStationsWithoutCoordinates );

// for http://www.baseurl.com/protected/reports/withoutMeters/csv
router.route( '/withoutMeters/:output' )
  .get( controller.listStationsWhichNeedMeters );

// for http://www.baseurl.com/protected/reports/wallmounts/csv
router.route( '/wallmounts/:output' )
  .get( controller.generateListOfWallmounts );

// for http://www.baseurl.com/protected/reports/wrongCoordinates/web
router.route( '/wrongCoordinates/:output' )
  .get( controller.getMismatchedStationCoordinates );

// CSV ONLY BELOW //
////////////////////

// for http://www.baseurl.com/protected/reports/downloadStations/CSV
router.route( '/downloadStations/CSV' )
  .get( controller.exportStationDataAsCsv );

// for http://www.baseurl.com/protected/reports/downloadStations/CSV
router.route( '/chargeEventsOverTime/CSV' )
  .get( controller.getChargeDataOverTime );

module.exports = router;