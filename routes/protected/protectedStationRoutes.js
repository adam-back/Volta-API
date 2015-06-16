var express = require( 'express' );
var router = express.Router();
var controller = require( '../../controllers/protected/station.protectedController.js' );

// for http://www.baseurl.com/protected/station
router.route( '/' )
  .get( controller.getAllStations )
  .post( controller.addStation )
  .patch( controller.editStation );

router.route( '/:kin' )
  .delete( controller.deleteStation );

// for http://www.baseurl.com/protected/station/edit
router.route( '/edit' )
  .get( controller.getOneStation );
  // ^ only for testing purposes

module.exports = router;