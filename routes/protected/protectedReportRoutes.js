var express = require( 'express' );
var router = express.Router();
var controller = require( '../../controllers/protected/reports.protectedController.js' );

// for http://www.baseurl.com/protected/reports/broken
router.route( '/broken' )
  .get( controller.getBrokenPlugs );

module.exports = router;