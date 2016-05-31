var Q = require( 'q' );
var models = require( '../../../models' );
var moment = require( 'moment' );
moment().format();
var factory = require( '../../../factories/reports/networkMapData.js' );

module.exports = function() {
  describe('networkMapData.js', function() {
    describe('countChargeEventsForNetwork', function() {
      var countChargeEventsForNetwork = factory.countChargeEventsForNetwork;

      it('should be defined as a function', function() {
        expect( typeof countChargeEventsForNetwork ).toBe( 'function' );
      });
    });

    describe('aggregateNetworkMapData', function() {
      var aggregateNetworkMapData = factory.aggregateNetworkMapData;

      it('should be defined as a function', function() {
        expect( typeof aggregateNetworkMapData ).toBe( 'function' );
      });
    });
  });
};