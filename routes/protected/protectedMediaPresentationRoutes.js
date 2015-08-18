var express = require( 'express' );
var router = express.Router();
var controller = require( '../../controllers/protected/mediaPresentation.protectedController.js' );

// for http://www.baseurl.com/mediaPresentations
router.route( '/' )
  .get( controller.getAllMediaPresentations )
  .post( controller.addMediaPresentation )
  .patch( controller.updateMediaPresentation )

router.route( '/kin/:kin')
  .get( controller.getMediaPresentationsByKin )

router.route( '/schedule/:id')
	.get( controller.getMediaPresentationsBySchedule )

router.route( '/:id' )
	.get( controller.getMediaPresentationById )
  .delete( controller.deleteMediaPresentation )

// // for http://www.baseurl.com/plug/42
// router.route( '/:id' )
//   .get( controller.getOnePlug )
//   .delete( controller.deletePlug );

module.exports = router;
