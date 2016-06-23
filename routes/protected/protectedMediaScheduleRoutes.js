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
router.route( '/serial/:serialNumber' )
  .get( controller.getMediaScheduleBySerialNumber )
  .post( controller.setMediaScheduleSerialNumber );

router.route( '/notification/downloadedPresentations/:serialNumber' )
  .post( controller.setDownloadedPresentationsBySerialNumber );

router.route( '/notification/playingPresentation/:serialNumber' )
  .post( controller.setPlayingPresentationBySerialNumber );

router.route( '/notification/slidesViewStatus/:serialNumber' )
  .post( controller.setSlideViewStatus );

// Will be used by Station Manager
// for http://www.baseurl.com/protected/mediaSchedule/1
router.route( '/:id' )
	.delete( controller.deleteMediaSchedule );

module.exports = router;
