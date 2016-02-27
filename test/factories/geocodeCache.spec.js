var config    = require( '../../config/config' ).development;
var Q = require( 'q' );
var rewire = require( 'rewire' );
var factory = rewire( '../../factories/geocodeCache.js' );

module.exports = function() {
  describe('geocodeCache.js', function() {
    describe('geocodeOneGroup', function() {
      var geocodeOneGroup = factory.geocodeOneGroup;
      var geocode, revert, mockGeocode;

      beforeEach(function() {
        geocodeCache = {};
      });

      afterEach(function(  ) {
        if ( typeof revert === 'function' ) {
          revert();
        }
      });

      it('should be defined as a function', function() {
        expect( typeof geocodeOneGroup ).toBe( 'function' );
      });

      it('should endcode address', function( done ) {
        mockGeocode = {
          geocode: function( address, cb ) {
            expect( address ).toBe( '123 Main' );
            cb( null, [ { latitude: 2, longitude: 3 } ] );
          }
        };
        spyOn( mockGeocode, 'geocode' ).andCallThrough();
        revert = factory.__set__( 'geocoder', mockGeocode );

        geocodeOneGroup( '1', '123 Main' )
        .then(function( gpx ) {
          expect( mockGeocode.geocode ).toHaveBeenCalled();
          done();
        })
        .catch(function( error ) {
          expect( error ).toBe( 1 );
          done();
        });
      });

      it('should return array with kin and gps data', function( done ) {
        mockGeocode = {
          geocode: function( address, cb ) {
            expect( address ).toBe( '123 Main' );
            cb( null, [ { latitude: 2, longitude: 3 } ] );
          }
        };
        revert = factory.__set__( 'geocoder', mockGeocode );

        geocodeOneGroup( '1', '123 Main' )
        .then(function( gpx ) {
          expect( Array.isArray( gpx ) ).toBe( true );
          expect( gpx[ 0 ] ).toBe( '1' );
          expect( gpx[ 1 ][ 0 ].latitude ).toBe( 2 );
          expect( gpx[ 1 ][ 0 ].longitude ).toBe( 3 );
          done();
        })
        .catch(function( error ) {
          expect( error ).toBe( 1 );
          done();
        });
      });

      it('should populate the geocodeCache', function( done ) {
        mockGeocode = {
          geocode: function( address, cb ) {
            cb( null, [ { latitude: 2, longitude: 3 } ] );
          }
        };
        revert = factory.__set__( 'geocoder', mockGeocode );

        geocodeOneGroup( '1', '123 Main' )
        .then(function( gpx ) {
          expect( factory.geocodeCache.hasOwnProperty( '1' ) ).toBe( true);
          expect( Array.isArray( factory.geocodeCache[ '1' ] ) ).toBe( true );
          expect( factory.geocodeCache[ '1' ][ 0 ] ).toBe( 2 );
          expect( factory.geocodeCache[ '1' ][ 1 ] ).toBe( 3 );
          done();
        })
        .catch(function( error ) {
          expect( error ).toBe( 1 );
          done();
        });
      });

      it('should catch and reject with error', function( done ) {
        mockGeocode = {
          geocode: function( address, cb ) {
            cb( 'Test', null );
          }
        };
        spyOn( mockGeocode, 'geocode' ).andCallThrough();
        revert = factory.__set__( 'geocoder', mockGeocode );

        geocodeOneGroup( '1', '123 Main' )
        .catch(function( error ) {
          expect( mockGeocode.geocode ).toHaveBeenCalled();
          expect( mockGeocode.geocode.calls[ 0 ].args[ 0 ] ).toBe( '123 Main' );
          expect( error ).toBe( 'Test' );
          done();
        });
      });
    });

    describe('geocodeGroupsWithoutGPS', function() {
      var geocodeGroupsWithoutGPS = factory.geocodeGroupsWithoutGPS;
      var groupsOfStations, geocode;

      beforeEach(function() {
        groupsOfStations = {
          '001-0001-001': {
            address: 'home',
            gps: []
          },
          '002-0002-002': {
            address: 'not home',
            gps: []
          }
        };
        geocode = Q.defer();
        spyOn( factory, 'geocodeOneGroup' ).andReturn( geocode.promise );
      });

      it('should be defined as a function', function() {
        expect( typeof geocodeGroupsWithoutGPS ).toBe( 'function' );
      });

      it('should geocode stations not in cache', function( done ) {
        geocode.reject( 'Fail.' );
        geocodeGroupsWithoutGPS( groupsOfStations )
        .catch(function() {
          expect( factory.geocodeOneGroup.calls.length ).toBe( 2 );
          done();
        });
      });

      it('should not geocode if station found in cache', function( done ) {
        factory.geocodeCache[ '001-0001-001' ] = [ 3, 4 ];

        delete groupsOfStations[ '002-0002-002' ];
        geocodeGroupsWithoutGPS( groupsOfStations )
        .then(function( result ) {
          expect( factory.geocodeOneGroup ).not.toHaveBeenCalled();
          expect( Array.isArray( result ) ).toBe( true );
          expect( result.length ).toBe( 1 );
          groupsOfStations[ '001-0001-001' ].gps = [ 3, 4 ];
          expect( result[ 0 ] ).toEqual( groupsOfStations[ '001-0001-001' ] );
          done();
        })
        .catch(function() {
          expect( error ).toBe( 1 );
          done();
        });
      });

      it('should resolve an array of updated stations', function( done ) {
        geocode.resolve( [ '001-0001-001', [ { latitude: 1, longitude: 2 } ] ] );
        delete groupsOfStations[ '002-0002-002' ];
        geocodeGroupsWithoutGPS( groupsOfStations )
        .then(function( result ) {
          expect( Array.isArray( result ) ).toBe( true );
          expect( result.length ).toBe( 1 );
          groupsOfStations[ '001-0001-001' ].gps = [ 1, 2 ];
          expect( result[ 0 ] ).toEqual( groupsOfStations[ '001-0001-001' ] );
          done();
        })
        .catch(function( error ) {
          expect( error ).toBe( 1 );
          done();
        });
      });

      it('should handle stations in cache and not', function( done ) {
        factory.geocodeCache[ '001-0001-001' ] = [ 3, 4 ];
        geocode.resolve( [ '002-0002-002', [ { latitude: 1, longitude: 2 } ] ] );
        geocodeGroupsWithoutGPS( groupsOfStations )
        .then(function( result ) {
          expect( factory.geocodeOneGroup.calls.length ).toBe( 1 );
          expect( Array.isArray( result ) ).toBe( true );
          expect( result.length ).toBe( 2 );
          groupsOfStations[ '001-0001-001' ].gps = [ 3, 4 ];
          groupsOfStations[ '002-0002-002' ].gps = [ 1, 2 ];
          expect( result[ 0 ] ).toEqual( groupsOfStations[ '001-0001-001' ] );
          expect( result[ 1 ] ).toEqual( groupsOfStations[ '002-0002-002' ] );
          done();
        })
        .catch(function() {
          expect( error ).toBe( 1 );
          done();
        });
      });

      it('should return an array of objects', function( done ) {
        factory.geocodeCache[ '001-0001-001' ] = [ 3, 4 ];
        geocode.resolve( [ '002-0002-002', [ { latitude: 1, longitude: 2 } ] ] );
        geocodeGroupsWithoutGPS( groupsOfStations )
        .then(function( result ) {
          expect( Array.isArray( result ) ).toBe( true );
          expect( result.length ).toBe( 2 );
          for ( var i = 0; i < result.length; i++ ) {
            expect( typeof result[ i ] ).toBe( 'object' );
            expect( Array.isArray( result[ i ] ) ).toBe( false );
          }
          done();
        })
        .catch(function() {
          expect( error ).toBe( 1 );
          done();
        });
      });
    });
  });
};