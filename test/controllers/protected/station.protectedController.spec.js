var supertest = require( 'supertest' );
var app = require( '../../../server.js' ).app;
supertest = supertest( app );
var Q = require( 'q' );
var station = require( '../../../models' ).station;

module.exports = function() {
  describe('stations/count', function() {
    describe('GET', function() {
      var countStations;

      beforeEach(function() {
        countStations = Q.defer();
        spyOn( station, 'count' ).andReturn( countStations.promise );
      });

      it('should be protected', function( done ) {
        supertest.get( '/protected/stations/count' )
        .expect( 401 )
        .end( done );
      });

      xit('should return JSON of current station count', function( done ) {
        var currentCount = 159;
        countStations.resolve( currentCount );
        supertest.get( '/protected/stations/count' )
        .expect( 200 )
        .expect( 'Content-Type', /json/ )
        .expect( JSON.stringify( currentCount ) )
        .end( done );
      });

      xit('should return 500 error for failure', function( done ) {
        countStations.reject( 'Couldn\'t find all stations.' );
        supertest.get( '/stations' )
        .expect( 500 )
        .expect( 'Couldn\'t find all stations.' )
        .end( done );
      });
    });
  });
};