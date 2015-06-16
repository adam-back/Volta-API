var express = require( 'express' );
var router = express.Router();
var controller = require( '../../controllers/plug.controller.js' );

// for http://www.baseurl.com/plugs/
router.route( '/' )
  .get( controller.getAllPlugs )
  .post( controller.addPlug )
  .patch( controller.updatePlug );

router.route( '/:id' )
  .get( controller.getOnePlug )
  .delete( controller.deletePlug );

module.exports = router;
