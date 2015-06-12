var express = require( 'express' );
var router = express.Router();
var controller = require( '../controllers/plug.controller.js' );

// for http://www.baseurl.com/plugs/
router.route( '/' )
  .get( controller.getAllPlugs );

router.route( '/:kin' )
  .get( controller.getOnePlug );

router.route( '/' )
	.post( controller.addPlug );

router.route( '/:id' )
	.delete( controller.deletePlug );

router.route( '/:id' )
  .patch( controller.updatePlug );

module.exports = router;
