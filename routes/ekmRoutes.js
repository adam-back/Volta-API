var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.send('Made it to root path: EKM');
});

module.exports = router;

  // router.route( '/' )
  //   .get(function( req, res ) {
      // res.send( 'You\'ve reached ' + req.url + '.' );

  // router.route( '/:id' )
  //   .get(function( req, res ) {
  //     res.send( 'You\'ve reached ' + req.url + '.' )
  //   });