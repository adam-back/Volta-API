var supertest = require( 'supertest' );
var app = require( '../../../server.js' ).app;
supertest = supertest( app );
var Q = require( 'q' );
var station = require( '../../../models' ).station;
var appSponsorFactory = require( '../../../factories/appSponsorFactory' );
var createToken = require( '../../jwtHelper' ).createToken;
var token = createToken( 5 );

module.exports = function() {
  describe('station/', function() {
    var route = '/protected/station';

    describe('GET', function() {
      var stationFind;

      beforeEach(function() {
        stationFind = Q.defer();
        spyOn( station, 'findAll' ).andReturn( stationFind.promise );
      });

      it('should be defined as a route', function( done ) {
        supertest.get( route )
        .expect(function( res ) {
          expect( res.statusCode ).not.toBe( 404 );
        })
        .end( done );
      });

      it('should be protected', function( done ) {
        supertest.get( route )
        .expect( 401 )
        .end( done );
      });

      it('should return JSON of all stations', function( done ) {
        var stations = [ { id: 1 }, { id: 2 } ];
        stationFind.resolve( stations );
        supertest.get( route )
        .set( 'Authorization', 'Bearer ' + token )
        .expect( 200 )
        .expect( JSON.stringify( stations ) )
        .expect( 'Content-Type', /json/ )
        .expect(function( res ) {
          expect( station.findAll ).toHaveBeenCalled();
          expect( station.findAll ).toHaveBeenCalledWith();
        })
        .end( done );
      });

      it('should return 500 failure for error', function( done ) {
        stationFind.reject( 'Test' );
        supertest.get( route )
        .set( 'Authorization', 'Bearer ' + token )
        .expect( 500 )
        .expect( 'Test' )
        .expect(function( res ) {
          expect( station.findAll ).toHaveBeenCalled();
        })
        .end( done );
      });
    });

    describe('POST', function() {
      var findOrCreateStation, associateStation;
      var body = {
        kin: '001-0001-001-01-K',
        location_address: '123 Main'
      };

      beforeEach(function(  ) {
        findOrCreateStation = Q.defer();
        associateStation = Q.defer();
        spyOn( station, 'findOrCreate' ).andReturn( findOrCreateStation.promise );
        spyOn( appSponsorFactory, 'associateStationWithAppSponsors' ).andReturn( associateStation.promise );
        spyOn( station, 'destroy' );
      });

      it('should be defined as a route', function( done ) {
        supertest.post( route )
        .expect(function( res ) {
          expect( res.statusCode ).not.toBe( 404 );
        })
        .end( done );
      });

      it('should be protected', function( done ) {
        supertest.post( route )
        .expect( 401 )
        .end( done );
      });

      it('should findOrCreate a station', function( done ) {
        findOrCreateStation.reject( 'Fake reject.' );
        supertest.post( route )
        .set( 'Authorization', 'Bearer ' + token )
        .send( body )
        .expect( 500 )
        .expect( 'Fake reject.' )
        .expect(function( res ) {
          expect( station.findOrCreate ).toHaveBeenCalled();
          expect( station.findOrCreate ).toHaveBeenCalledWith( { where: { kin: '001-0001-001-01-K' }, defaults: body } );
          expect( station.destroy ).not.toHaveBeenCalled();
        })
        .end( done );
      });

      it('should return return false if found', function( done ) {
        body.id = 1;
        findOrCreateStation.resolve( body , false );
        supertest.post( route )
        .set( 'Authorization', 'Bearer ' + token )
        .send( body )
        .expect( 200 )
        .expect( JSON.stringify( { successfullyAddedStation: false } ) )
        .expect( 'Content-Type', /json/ )
        .expect(function( res ) {
          expect( appSponsorFactory.associateStationWithAppSponsors ).not.toHaveBeenCalled();
        })
        .end( done );
      });

      it('should associate station if created and return true', function( done ) {
        body.id = 1;
        findOrCreateStation.resolve( [ body, true ] );
        associateStation.resolve();
        supertest.post( route )
        .set( 'Authorization', 'Bearer ' + token )
        .send( body )
        .expect( 200 )
        .expect( JSON.stringify( { successfullyAddedStation: true } ) )
        .expect( 'Content-Type', /json/ )
        .expect(function( res ) {
          expect( appSponsorFactory.associateStationWithAppSponsors ).toHaveBeenCalled();
          expect( appSponsorFactory.associateStationWithAppSponsors ).toHaveBeenCalledWith( body );
        })
        .end( done );
      });

      it('should destroy station if error is thrown on associate', function( done ) {
        body.id = 1;
        findOrCreateStation.resolve( [ body, true ] );
        associateStation.reject( 'Because I said so.' );
        supertest.post( route )
        .set( 'Authorization', 'Bearer ' + token )
        .send( body )
        .expect( 500 )
        .expect( 'Because I said so.' )
        .expect(function( res ) {
          expect( appSponsorFactory.associateStationWithAppSponsors ).toHaveBeenCalled();
          expect( appSponsorFactory.associateStationWithAppSponsors ).toHaveBeenCalledWith( body );
          expect( station.destroy ).toHaveBeenCalled();
          expect( station.destroy ).toHaveBeenCalledWith( { where: { id: 1 }, force: true } );
        })
        .end( done );
      });
    });

    describe('PATCH', function() {
      it('should be defined as a route', function( done ) {
        supertest.patch( route )
        .expect(function( res ) {
          expect( res.statusCode ).not.toBe( 404 );
        })
        .end( done );
      });

      it('should be protected', function( done ) {
        supertest.patch( route )
        .expect( 401 )
        .end( done );
      });
    });
  });

  describe('station/count', function() {
    describe('GET', function() {
      var countStations;
      var route = '/protected/station/count';

      beforeEach(function() {
        countStations = Q.defer();
        spyOn( station, 'count' ).andReturn( countStations.promise );
      });

      it('should be defined as a route', function( done ) {
        supertest.get( route )
        .expect(function( res ) {
          expect( res.statusCode ).not.toBe( 404 );
        })
        .end( done );
      });

      it('should be protected', function( done ) {
        supertest.get( route )
        .expect( 401 )
        .end( done );
      });

      it('should return JSON of current station count', function( done ) {
        var currentCount = 159;
        countStations.resolve( currentCount );
        supertest.get( route )
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
        supertest.get( route )
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

  describe('station/:kin', function() {
    var route = '/protected/station/001-0001-001-01-K';

    describe('GET', function() {
      it('should be defined as a route', function( done ) {
        supertest.get( route )
        .expect(function( res ) {
          expect( res.statusCode ).not.toBe( 404 );
        })
        .end( done );
      });

      it('should be protected', function( done ) {
        supertest.get( route )
        .expect( 401 )
        .end( done );
      });
    });

    describe('PUT', function() {
      it('should be defined as a route', function( done ) {
        supertest.put( route )
        .expect(function( res ) {
          expect( res.statusCode ).not.toBe( 404 );
        })
        .end( done );
      });

      it('should be protected', function( done ) {
        supertest.put( route )
        .expect( 401 )
        .end( done );
      });
    });

    describe('DELETE', function() {
      it('should be defined as a route', function( done ) {
        supertest.delete( route )
        .expect(function( res ) {
          expect( res.statusCode ).not.toBe( 404 );
        })
        .end( done );
      });

      it('should be protected', function( done ) {
        supertest.delete( route )
        .expect( 401 )
        .end( done );
      });
    });
  });
};