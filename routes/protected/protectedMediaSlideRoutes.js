var express = require( 'express' );
var router = express.Router();
var controller = require( '../../controllers/protected/mediaSlide.protectedController.js' );

// for http://www.baseurl.com/protected/mediaSlide
router.route( '/' )
  .get( controller.getAllMediaSlides )
  .post( controller.addMediaSlide )
  .patch( controller.updateMediaSlide )

// router.route( '/kin/:kin')
//   .get( controller.getMediaSlidesByKin )

router.route( '/:id')
	.delete( controller.deleteMediaSlide )

// // for http://www.baseurl.com/plug/42
// router.route( '/:id' )
//   .get( controller.getOnePlug )
//   .delete( controller.deletePlug );

module.exports = router;
