var express = require( 'express' );
var router = express.Router();
var controller = require( '../../controllers/protected/appUsers.protectedController.js' );

// for http://www.baseurl.com/protected/app/user/create
router.route( '/create' )
  .post( controller.createUser );

// for http://www.baseurl.com/protected/app/user/authenticate
router.route( '/authenticate' )
  .post( controller.authenticate );

module.exports = router;