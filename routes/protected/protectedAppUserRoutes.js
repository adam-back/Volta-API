var express = require( 'express' );
var router = express.Router();
var controller = require( '../../controllers/protected/appUsers.protectedController.js' );

// for http://www.baseurl.com/protected/app/user/create
router.route( '/create' )
  .post( controller.createUser );

module.exports = router;