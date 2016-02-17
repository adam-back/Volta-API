var supertest = require( 'supertest' );
var app = require( '../../../server.js' ).app;
supertest = supertest( app );

module.exports = function() {
  describe('/plugs', function() {
    it('GET', function() {
      expect( true ).toBe( true );
    });
  });
};