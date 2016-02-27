var express = require( 'express' );
var router = express.Router();
var controller = require( '../../controllers/protected/d3.protectedController.js' );

// for http://www.baseurl.com/protected/D3/networkSunburst
router.route( '/networkSunburst' )
  .get( controller.getSunburstData );

// for http://www.baseurl.com/protected/D3/kinNetwork
router.route( '/kinNetwork' )
  .get( controller.getKinNetworkAbbreviations );

// for http://www.baseurl.com/protected/D3/kinGrowth
router.route( '/kinGrowth' )
  .get( controller.getKinGrowthOverTime );

router.route( '/30Days')
  .get( controller.get30DaysData );

module.exports = router;