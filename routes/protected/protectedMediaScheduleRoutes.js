var express = require( 'express' );
var router = express.Router();
var controller = require( '../../controllers/protected/mediaSchedule.protectedController.js' );

// Used by Station Manager
router.route( '/' )
  .get( controller.getAllMediaSchedulesWithPresentations )
  .post( controller.addMediaSchedule )
  .patch( controller.replaceMediaSchedule )

// Used by media players
router.route( '/serial/:serialNumber')
  .get( controller.getMediaScheduleBySerialNumber )
  .post( controller.setMediaScheduleSerialNumber )

// Will be used by Station Manager
router.route( '/:id' )
	.delete( controller.deleteMediaSchedule )

module.exports = router;
