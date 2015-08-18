var express = require( 'express' );
var router = express.Router();
var controller = require( '../../controllers/protected/mediaSchedule.protectedController.js' );

// for http://www.baseurl.com/mediaSchedule
router.route( '/' )
  // .get( controller.getMediaScheduleWithPresentationSlideURLsForKin )
  .get( controller.getAllMediaSchedules )
  .post( controller.addMediaSchedule )
  .patch( controller.updateMediaSchedule )

router.route( '/kin/:kin')
  .get( controller.getMediaScheduleByKin )

// // for http://www.baseurl.com/plug/42
// router.route( '/:id' )
//   .get( controller.getOnePlug )
//   .delete( controller.deletePlug );

module.exports = router;
