var express = require( 'express' );
var router = express.Router();
var controller = require( '../../controllers/protected/station.protectedController.js' );

// for http://www.baseurl.com/protected/station
router.route( '/' )
  .get( controller.getAllStations )
  .post( controller.addStation )
  .patch( controller.editStation );

// for http://www.baseurl.com/protected/station/count
router.route( '/count' )
  .get( controller.countStations );

// for http://www.baseurl.com/protected/station/001-0001-001-01-K
router.route( '/:kin' )
  .get( controller.getOneStation )
  .delete( controller.deleteStation )
  .put( controller.setStationStatus ); //KILLSWITCH

module.exports = router;