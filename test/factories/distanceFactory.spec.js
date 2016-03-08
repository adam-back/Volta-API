var factory = require( '../../factories/distanceFactory.js' );

module.exports = function() {
  describe('distanceFactory.js', function() {
    describe('convertDegreesToRadians', function() {
      var convertDegreesToRadians = factory.convertDegreesToRadians;

      it('should be defined as a function', function() {
        expect( typeof convertDegreesToRadians ).toBe( 'function' );
      });

      it('should return a number', function() {
        expect( typeof convertDegreesToRadians( 1 ) ).toBe( 'number' );
      });

      it('should convert 1 degree to .0174533 radians', function() {
        expect( convertDegreesToRadians( 1 ) ).toBeCloseTo(  .0174533, 7 );
      });
    });

    describe('getDistanceFromLatLonInMiles', function() {
      var getDistanceFromLatLonInMiles = factory.getDistanceFromLatLonInMiles;

      // Volta HQ
      var start = [ 37.765281, -122.399029 ];
      // Alameda South Shore
      var finish = [ 37.756868, -122.253072 ];
      // 8 miles

      it('should be defined as a function', function() {
        expect( typeof getDistanceFromLatLonInMiles ).toBe( 'function' );
      });

      it('should return a number', function() {
        expect( typeof getDistanceFromLatLonInMiles( start, finish ) ).toBe( 'number' );
      });

      it('should make use of convertDegreesToRadians', function() {
        spyOn( factory, 'convertDegreesToRadians' ).andCallThrough();
        getDistanceFromLatLonInMiles( start, finish );
        expect( factory.convertDegreesToRadians ).toHaveBeenCalled();
      });

      it('should calculate rough distance of 8 miles, within tenths', function() {
        expect( getDistanceFromLatLonInMiles( start, finish ) ).toBeCloseTo( 8, 1 );
      });
    });
  });
};