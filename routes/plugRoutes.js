var express = require( 'express' );
var router = express.Router();
var controller = require( '../controllers/plug.controller.js' );

// for http://www.baseurl.com/plugs/
router.route( '/' )
  .get( controller.getAllPlugs )
	.post( controller.addPlug );

router.route( '/:id' )
  .get( controller.getOnePlug )
  .patch( controller.updatePlug )
  .delete( controller.deletePlug );

module.exports = router;
