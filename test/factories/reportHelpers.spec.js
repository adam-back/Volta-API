var reportHelpers = require( '../../factories/reportHelpers.js' );
var Q = require( 'q' );
var db = require( '../../models/index.js' );
var csv = require( '../../factories/csvFactory.js' );

describe('reportHelpers (KIN and Network CSV)', function() {
  describe('standardizeNetworkInfo', function() {
    var standardizeNetworkInfo = reportHelpers.standardizeNetworkInfo;
    var stations;

    beforeEach(function() {
      stations = [ { network: 'LA' }, { network: 'NoCal' }, { network: 'SD' } ];
    });

    it('should be defined as a function', function() {
      expect( typeof standardizeNetworkInfo ).toBe( 'function' );
    });

    it('should return an array of stations', function() {
      var result = standardizeNetworkInfo( stations );
      expect( Array.isArray( result ) ).toBe( true );
      expect( result.length ).toBe( 3 );
    });

    it('should add networkCode and networkName for each station', function() {
      var result = standardizeNetworkInfo( stations );
      for ( var i = 0; i < result.length; i++ ) {
        expect( result[ i ].hasOwnProperty( 'networkCode' ) ).toBe( true );
        expect( result[ i ].hasOwnProperty( 'networkName' ) ).toBe( true );
      }
    });

    it('should remove the network field from all stations', function() {
      var result = standardizeNetworkInfo( stations );
      for ( var i = 0; i < result.length; i++ ) {
        expect( result[ i ].hasOwnProperty( 'network' ) ).toBe( false );
      }
    });

    it('should throw an error if it sees a network it doesn\'t recognize', function() {
      stations[ 1 ].network = 'SB';
      expect( function() { standardizeNetworkInfo( stations ); } ).toThrow( new Error ( 'Did not account for network SB' ) );
    });

    describe('network names', function() {
      beforeEach(function() {
        stations = [ { network: '' } ];
      });

      it('should change SD into SD and San Diego', function() {
        stations[ 0 ].network = 'SD';
        var result = standardizeNetworkInfo( stations );
        expect( stations[ 0 ].networkCode ).toBe( 'SD' );
        expect( stations[ 0 ].networkName ).toBe( 'San Diego' );
      });

      it('should change Chicago into CHI and Chicagoland', function() {
        stations[ 0 ].network = 'Chicago';
        var result = standardizeNetworkInfo( stations );
        expect( stations[ 0 ].networkCode ).toBe( 'CHI' );
        expect( stations[ 0 ].networkName ).toBe( 'Chicagoland' );
      });

      it('should change Arizona into AZ and Arizona', function() {
        stations[ 0 ].network = 'Arizona';
        var result = standardizeNetworkInfo( stations );
        expect( stations[ 0 ].networkCode ).toBe( 'AZ' );
        expect( stations[ 0 ].networkName ).toBe( 'Arizona' );
      });

      it('should change Hawaii into HI and Hawaii', function() {
        stations[ 0 ].network = 'Hawaii';
        var result = standardizeNetworkInfo( stations );
        expect( stations[ 0 ].networkCode ).toBe( 'HI' );
        expect( stations[ 0 ].networkName ).toBe( 'Hawaii' );
      });

      it('should change NoCal into NORCAL and Northern California', function() {
        stations[ 0 ].network = 'NoCal';
        var result = standardizeNetworkInfo( stations );
        expect( stations[ 0 ].networkCode ).toBe( 'NORCAL' );
        expect( stations[ 0 ].networkName ).toBe( 'Northern California' );
      });

      it('should change LA into LA and Los Angeles', function() {
        stations[ 0 ].network = 'LA';
        var result = standardizeNetworkInfo( stations );
        expect( stations[ 0 ].networkCode ).toBe( 'LA' );
        expect( stations[ 0 ].networkName ).toBe( 'Los Angeles' );
      });

      it('should change OC into LA and Los Angeles', function() {
        stations[ 0 ].network = 'OC';
        var result = standardizeNetworkInfo( stations );
        expect( stations[ 0 ].networkCode ).toBe( 'LA' );
        expect( stations[ 0 ].networkName ).toBe( 'Los Angeles' );
      });
    });
  });

  describe('formatKinsWithNetworks', function() {
    var formatKinsWithNetworks = reportHelpers.formatKinsWithNetworks;
    var getAllStations, generateCSV;
    var stations = [ { kin: '001-0001-001-01-K', network: 'LA' }, { kin: '002-0001-001-01-K', network: 'NoCal' }, { kin: '003-0001-001-01-K', network: 'SD' } ];

    beforeEach(function() {
      getAllStations = Q.defer();
      generateCSV = Q.defer();
      spyOn( db.station, 'findAll' ).andReturn( getAllStations.promise );
      spyOn( csv, 'generateCSV' ).andReturn( generateCSV.promise );
    });

    it('should be defined as a function', function() {
      expect( typeof formatKinsWithNetworks ).toBe( 'function' );
    });

    it('should get all stations\'s kins and networks, ordered by kin', function( done ) {
      getAllStations.reject();
      formatKinsWithNetworks()
      .catch(function() {
        expect( db.station.findAll ).toHaveBeenCalled();
        expect( db.station.findAll ).toHaveBeenCalledWith( { attributes: [ 'kin', 'network' ], order: 'kin', raw: true } );
        done();
      });
    });

    it('should standardize network names', function( done ) {
      getAllStations.resolve( stations );
      generateCSV.reject();
      spyOn( reportHelpers, 'standardizeNetworkInfo' );
      formatKinsWithNetworks()
      .catch(function() {
        expect( reportHelpers.standardizeNetworkInfo ).toHaveBeenCalled();
        expect( reportHelpers.standardizeNetworkInfo ).toHaveBeenCalledWith( stations );
        done();
      });
    });

    it('should generate a CSV called kin-networks.csv in networkLineChart directory', function( done ) {
      var fields = [ 'kin', 'networkCode', 'networkName' ];
      getAllStations.resolve( stations );
      generateCSV.reject();
      formatKinsWithNetworks()
      .catch(function() {
        expect( csv.generateCSV ).toHaveBeenCalled();
        expect( csv.generateCSV ).toHaveBeenCalledWith( stations, fields, fields );
        done();
      });
    });
  });
});