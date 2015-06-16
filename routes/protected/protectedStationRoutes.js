var express = require( 'express' );
var router = express.Router();
var controller = require( '../../controllers/protected/station.protectedController.js' );

// for http://www.baseurl.com/protected/station
router.route( '/' )
  .get( controller.getAllStations );

// for http://www.baseurl.com/protected/station/edit
router.route( '/edit' )
  .get( controller.getOneStation )
  // ^ only for testing purposes
  .post( controller.addStation )
  .put( controller.editStation )
  .delete( controller.deleteStation );

module.exports = router;