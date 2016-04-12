var Q = require( 'q' );
var rewire = require( 'rewire' );
var controller = rewire( '../../../../controllers/protected/reports.protectedController.js' );
var geocode = require( 'node-geocoder' );
var createToken = require( '../../../jwtHelper' ).createToken;
var token = createToken();

module.exports = function() {
  describe('REPORTS', function() {
    describe('geocodeLater', function() {
      var geocodeLater = controller.geocodeLater;
      var mockGeocoder, revert;

      beforeEach(function() {
        jasmine.Clock.useMock();
      });

      afterEach(function() {
        if ( typeof revert === 'function' ) {
          revert();
        }
      });

      it('should be defined as a function', function() {
        expect( typeof geocodeLater ).toBe( 'function' );
      });

      it('should return a promise', function( done ) {
        var result = geocodeLater();
        expect( Q.isPromise( result ) ).toBe( true );
        done();
      });

      it('should geocode address after a delay', function() {
        var geocode = Q.defer();
        mockGeocoder = {
          geocode: function( address ) {
            return void( 0 );
          }
        };

        spyOn( mockGeocoder, 'geocode' ).andReturn( geocode.promise );
        revert = controller.__set__( 'geocoder', mockGeocoder );
        geocode.resolve( [ { latitude: 1, longitude: 2 } ] );
        geocodeLater( 1000, '123 Main' );

        jasmine.Clock.tick( 999 );
        expect( mockGeocoder.geocode ).not.toHaveBeenCalled();
        jasmine.Clock.tick( 1001 );
        expect( mockGeocoder.geocode ).toHaveBeenCalled();
        expect( mockGeocoder.geocode ).toHaveBeenCalledWith( '123 Main' );
      });

      it('should resolve gpx data', function( done ) {
        var geocode = Q.defer();
        mockGeocoder = {
          geocode: function( address ) {
            return void( 0 );
          }
        };

        spyOn( mockGeocoder, 'geocode' ).andReturn( geocode.promise );
        revert = controller.__set__( 'geocoder', mockGeocoder );
        geocode.resolve( [ { latitude: 1, longitude: 2 } ] );
        geocodeLater( 1000, '123 Main' )
        .then(function( res ) {
          expect( Array.isArray( res ) ).toBe( true );
          expect( res.length ).toBe( 1 );
          expect( res ).toEqual( [ { latitude: 1, longitude: 2 } ] );
          done();
        })
        .catch(function( error ) {
          expect( error ).not.toBeDefined();
          done();
        });

        jasmine.Clock.tick( 999 );
        expect( mockGeocoder.geocode ).not.toHaveBeenCalled();
        jasmine.Clock.tick( 1001 );
        expect( mockGeocoder.geocode ).toHaveBeenCalled();
      });

      it('should propagate errors', function( done ) {
        var geocode = Q.defer();
        mockGeocoder = {
          geocode: function( address ) {
            return void( 0 );
          }
        };

        spyOn( mockGeocoder, 'geocode' ).andReturn( geocode.promise );
        revert = controller.__set__( 'geocoder', mockGeocoder );
        geocode.reject( new Error( 'Quota exceeded' ) );
        geocodeLater( 1000, '123 Main' )
        .then(function( res ) {
          expect( res ).not.toBeDefined();
          done();
        })
        .catch(function( error ) {
          expect( error ).toEqual( new Error( 'Quota exceeded' ) );
          done();
        });

        jasmine.Clock.tick( 999 );
        expect( mockGeocoder.geocode ).not.toHaveBeenCalled();
        jasmine.Clock.tick( 1001 );
        expect( mockGeocoder.geocode ).toHaveBeenCalled();
      });
    });
  });
};