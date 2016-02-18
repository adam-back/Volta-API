var supertest = require( 'supertest' );
var app = require( '../../../server.js' ).app;
supertest = supertest( app );
var Q = require( 'q' );

module.exports = function() {
  describe('/stationImages', function() {
    describe('GET', function() {
      it('should 404', function( done ) {
        supertest.get( '/stationImages' )
        .expect( 404 )
        .end( done );

        // this unprotected route creates station_image rows
        // based on the contents of an S3 bucket.
        // Before use, the routes have to be uncommented
        // and the station_images in the db need to be wiped.
        // This test will need to be altered to allow merging.
      });
    });
  });
};