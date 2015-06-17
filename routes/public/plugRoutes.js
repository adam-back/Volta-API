var express = require( 'express' );
var router = express.Router();
var controller = require( '../../controllers/public/plug.controller.js' );

// for http://www.baseurl.com/plugs
router.route( '/' )
  .get( controller.getAllPlugs );

module.exports = router;
