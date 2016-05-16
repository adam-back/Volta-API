var express = require( 'express' );
var router = express.Router();
var controller = require( '../../controllers/protected/mediaSchedule.protectedController.js' );

// Used by Station Manager
// for http://www.baseurl.com/protected/mediaSchedule
router.route( '/' )
  .get( controller.getAllMediaSchedulesWithPresentations )
  .post( controller.addMediaSchedule )
  .patch( controller.replaceMediaSchedule );

router.route( '/checkForIssues' )
  .get( controller.getMediaPlayersInNeedOfMaintenance );

// Used by media players
// for http://www.baseurl.com/protected/mediaSchedule/serial/1
router.route( '/serial/:serialNumber')
  .get( controller.getMediaScheduleBySerialNumber )
  .post( controller.setMediaScheduleSerialNumber );

// Will be used by Station Manager
// for http://www.baseurl.com/protected/mediaSchedule/1
router.route( '/:id' )
	.delete( controller.deleteMediaSchedule );

module.exports = router;
