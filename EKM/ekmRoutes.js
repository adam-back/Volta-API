module.exports = exports = function( router ) {
  router.route( '/' )
    .get(function( req, res ) {
      res.send("I win!");
      // res.send( 'You\'ve reached ' + req.url + '.' );
    });

  // router.route( '/:id' )
  //   .get(function( req, res ) {
  //     res.send( 'You\'ve reached ' + req.url + '.' )
  //   });
};