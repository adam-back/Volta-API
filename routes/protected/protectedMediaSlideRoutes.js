var express = require( 'express' );
var router = express.Router();
var controller = require( '../../controllers/protected/mediaSlide.protectedController.js' );

// Used by Station Manager
// for http://www.baseurl.com/protected/mediaSlide
router.route( '/' )
  .get( controller.getAllMediaSlides )
  .post( controller.addMediaSlide );

// Will be used by Station Manager in the future
// for http://www.baseurl.com/protected/mediaSlide/42
router.route( '/:id')
	.delete( controller.deleteMediaSlide );

module.exports = router;
