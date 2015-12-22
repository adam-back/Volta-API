var express = require( 'express' );
var router = express.Router();
var controller = require( '../../controllers/protected/d3.protectedController.js' );

// for http://www.baseurl.com/protected/D3/networkSunburst
router.route( '/networkSunburst' )
  .get( controller.getSunburstData );

module.exports = router;