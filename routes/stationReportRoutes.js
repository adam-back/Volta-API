var express = require( 'express' );
var router = express.Router();
var controller = require( '../controllers/stationReport.controller.js' );

// for http://www.baseurl.com/stationReport/
router.route( '/' )
  .post( controller.saveReport );

module.exports = router;
