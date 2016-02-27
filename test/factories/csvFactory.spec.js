var createCSV = require( '../../factories/csvFactory.js' );

module.exports = function() {
  describe('csvFactory.js', function() {
    describe('generateCSV', function() {
      var generateCSV = createCSV.generateCSV;

      it('should be defined as a function', function() {
        expect( typeof generateCSV ).toBe( 'function' );
      });

      it('should generate CSV', function( done ) {
        var data = [ { kin: '1', location: 'Volta HQ' }, { kin: '2', location: 'Ballpark' }, { kin: '42', location: 'Restaurant at the End of the Universe' } ]
        var fields = [ 'kin', 'location' ];
        var fieldNames = [ 'KIN', 'Location' ];

        generateCSV( data, fields, fieldNames )
        .then(function( success ) {
          expect( success ).toBe( '"KIN","Location"\n"1","Volta HQ"\n"2","Ballpark"\n"42","Restaurant at the End of the Universe"' );
          done();
        })
        .catch(function( error ) {
          expect( error ).toBe( 1 );
          done();
        });
      });

      it('should fail to create CSV', function( done ) {
        var data = [ { kin: '1', location: 'Volta HQ' }, { kin: '2', location: 'Ballpark' }, { kin: '42', location: 'Retaurant at the End of the Universe' } ]
        var fields = [ 'kin', 'location' ];
        // wrong number of field names
        var fieldNames = [ 'KIN' ];

        generateCSV( data, fields, fieldNames )
        .catch(function( error ) {
          expect( error.message ).toBe( 'fieldNames and fields should be of the same length, if fieldNames is provided.' );
          done();
        });
      });
    });
  });
};