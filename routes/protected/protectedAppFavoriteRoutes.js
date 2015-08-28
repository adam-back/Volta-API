var express = require( 'express' );
var router = express.Router();
var controller = require( '../../controllers/protected/appFavorites.protectedController.js' );

// for http://www.baseurl.com/protected/app/user/favorites/#
router.route( '/:id' )
  .get( controller.getFavoriteStations );
  // .post( controller.addFavoriteStation )
  // .delete( controller.removeFavoriteStation );

module.exports = router;