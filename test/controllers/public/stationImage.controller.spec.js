var supertest = require( 'supertest' );
var app = require( '../../../server.js' ).app;
supertest = supertest( app );
var Q = require( 'q' );

module.exports = function() {
  describe('/stations', function() {
    describe('GET', function() {
      var findStations;

      beforeEach(function() {
        findStations = Q.defer();
        spyOn( station, 'findAll' ).andReturn( findStations.promise );
      });

      it('should return JSON of all stations', function( done ) {
        var allStations = [ { id: 1, kin: 12 } ];
        findStations.resolve( allStations );
        supertest.get( '/stations' )
        .expect( 200 )
        .expect( 'Content-Type', /json/ )
        .expect( JSON.stringify( allStations ) )
        .end( done );
      });

      it('should return 500 error for failure', function( done ) {
        findStations.reject( 'Couldn\'t find all stations.' );
        supertest.get( '/stations' )
        .expect( 500 )
        .expect( 'Couldn\'t find all stations.' )
        .end( done );
      });
    });

  });
};