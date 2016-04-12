var express = require( 'express' );
var router = express.Router();
var controller = require( '../../controllers/protected/mediaPresentation.protectedController.js' );

// Used by Station Manager
router.route( '/' )
  .get( controller.getAllMediaPresentations )
  .post( controller.addMediaPresentation )

// Used by Media Player
router.route( '/:id' )
	.get( controller.getMediaPresentationById )

  // Will be used by Station Manager in the future
  .delete( controller.deleteMediaPresentation )

module.exports = router;
