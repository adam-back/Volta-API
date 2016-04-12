var express = require( 'express' );
var router = express.Router();
var controller = require( '../../controllers/protected/plug.protectedController.js' );

// for http://www.baseurl.com/protected/plug
router.route( '/' )
  .get( controller.getAllPlugs )
  .post( controller.addPlug )
  .patch( controller.updatePlug );

// for http://www.baseurl.com/protected/plug/42
router.route( '/:id' )
  .get( controller.getOnePlug )
  .delete( controller.deletePlug );

module.exports = router;
