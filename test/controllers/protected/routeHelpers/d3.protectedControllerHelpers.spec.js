var moment = require( 'moment' );
moment().format();
var db = require( '../../../../models' );
var Q = require( 'q' );
var controller = require( '../../../../controllers/protected/d3.protectedController.js' );

module.exports = function() {
  describe('D3', function() {
    describe('memoizedData', function() {
      var memoizedData = controller.memoizedData;

      it('should be defined as an object', function() {
        expect( typeof memoizedData ).toBe( 'object' );
      });

      it('should have a kinNetworks key with data/lastFetch', function() {
        expect( memoizedData.hasOwnProperty( 'kinNetworks' ) ).toBe( true );
        expect( memoizedData.kinNetworks.hasOwnProperty( 'data' ) ).toBe( true );
        expect( memoizedData.kinNetworks.hasOwnProperty( 'lastFetch' ) ).toBe( true );
      });

      it('should have a kwhGrowth key with data/lastFetch', function() {
        expect( memoizedData.hasOwnProperty( 'kwhGrowth' ) ).toBe( true );
        expect( memoizedData.kwhGrowth.hasOwnProperty( 'data' ) ).toBe( true );
        expect( memoizedData.kwhGrowth.hasOwnProperty( 'lastFetch' ) ).toBe( true );
      });

      it('should have a sunburst key with data/lastFetch', function() {
        expect( memoizedData.hasOwnProperty( 'sunburst' ) ).toBe( true );
        expect( memoizedData.sunburst.hasOwnProperty( 'data' ) ).toBe( true );
        expect( memoizedData.sunburst.hasOwnProperty( 'lastFetch' ) ).toBe( true );
      });

      it('should not have additional keys', function() {
        var currentKeys = {
          kinNetworks: true,
          kwhGrowth: true,
          thirtyDays: true,
          sunburst: true,
          medianData: true
        };

        for ( var key in memoizedData ) {
          expect( currentKeys[ key ] ).toBe( true );
        }
      });
    });

    describe('isOld', function() {
      var isOld = controller.isOld;

      it('should be defined as a function', function() {
        expect( typeof isOld ).toBe( 'function' );
      });

      it('should return a boolean', function() {
        expect( typeof isOld( 'sunburst' ) ).toBe( 'boolean' );
      });

      describe('should return false', function() {
        it('if last fetch was after midnight last night (today)', function() {;
          // 12:01 am today
          controller.memoizedData.sunburst.lastFetch = moment().startOf( 'day' );
          expect( isOld( 'sunburst' ) ).toBe( false );
        });
      });

      describe('should return true', function() {
        it('if there is no last fetch', function() {
          controller.memoizedData.sunburst.lastFetch = null;
          expect( isOld( 'sunburst' ) ).toBe( true );
        });

        it('if last fetch was before midnight last night (yesterday)', function() {
          controller.memoizedData.sunburst.lastFetch = moment().subtract( 1, 'days' ).endOf( 'day' );
          expect( isOld( 'sunburst' ) ).toBe( true );
          // reset
          controller.memoizedData.sunburst.lastFetch = null;
        });
      });
    });
  });
};