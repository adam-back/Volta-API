var express = require( 'express' );
var router = express.Router();
var controller = require( '../../controllers/protected/app.protectedController.js' );

// for http://www.baseurl.com/protected/app/stations
router.route( '/stations' )
  .get( controller.getStationsAndPlugs );

module.exports = router;