var supertest = require( 'supertest' );
var app = require( '../../../server.js' ).app;
supertest = supertest( app );
var Q = require( 'q' );
var station = require( '../../../models' ).station;
var createToken = require( '../../jwtHelper' ).createToken;

module.exports = function() {
  describe('stations/count', function() {
    describe('GET', function() {
      var countStations;
      var token = createToken( 5 );

      beforeEach(function() {
        countStations = Q.defer();
        spyOn( station, 'count' ).andReturn( countStations.promise );
      });

      it('should be protected', function( done ) {
        supertest.get( '/protected/station/count' )
        .expect( 401 )
        .end( done );
      });

      it('should return JSON of current station count', function( done ) {
        var currentCount = 159;
        countStations.resolve( currentCount );
        supertest.get( '/protected/station/count' )
        .set( 'Authorization', 'Bearer ' + token )
        .expect( 200 )
        .expect( 'Content-Type', /json/ )
        .expect( JSON.stringify( currentCount ) )
        .expect(function( res ) {
          expect( station.count ).toHaveBeenCalled();
          expect( station.count ).toHaveBeenCalledWith();
        })
        .end( done );
      });

      it('should return 500 error for failure', function( done ) {
        countStations.reject( 'Couldn\'t count all stations.' );
        supertest.get( '/protected/station/count' )
        .set( 'Authorization', 'Bearer ' + token )
        .expect( 500 )
        .expect( 'Couldn\'t count all stations.' )
        .expect(function( res ) {
          expect( station.count ).toHaveBeenCalled();
          expect( station.count ).toHaveBeenCalledWith();
        })
        .end( done );
      });
    });
  });
};