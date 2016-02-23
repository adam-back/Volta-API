var kwhGrowth = require( '../../../factories/reports/kwhGrowthOverTime.js' );
var time = require( '../../../factories/reports/eventsOverTime.js' );
var Q = require( 'q' );
var db = require( '../../../models/index.js' );
var csv = require( '../../../factories/csvFactory.js' );

describe('kwhGrowthOverTime', function() {
  var kwhGrowthOverTime = kwhGrowth.kwhGrowthOverTime;
  var findAll, kwhDay, createCSV;
  var stations = [ { id: 1, location: 'Home', kin: '001-0001-001-01-K' }, { id: 2, location: 'Volta', kin: '001-0001-001-02-K' } ];

  beforeEach(function() {
    findAll = Q.defer();
    kwhDay = Q.defer();
    createCSV = Q.defer();
    spyOn( db.station, 'findAll' ).andReturn( findAll.promise );
    spyOn( time, 'kwhByDay' ).andReturn( kwhDay.promise );
    spyOn( csv, 'generateCSV' ).andReturn( createCSV.promise );
  });

  it('should be defined as a function', function() {
    expect( typeof kwhGrowthOverTime ).toBe( 'function' );
  });

  it('should find all stations', function( done ) {
    findAll.reject();
    kwhGrowthOverTime()
    .catch(function() {
      expect( db.station.findAll ).toHaveBeenCalled();
      done();
    });
  });

  it('should get kWh by day for each station', function( done ) {
    findAll.resolve( stations );
    kwhDay.reject();
    kwhGrowthOverTime()
    .catch(function() {
      expect( time.kwhByDay ).toHaveBeenCalled();
      expect( time.kwhByDay.calls.length ).toBe( 2 );
      expect( time.kwhByDay.calls[ 0 ].args[ 0 ] ).toEqual( { id: 1, location: 'Home', kin: '001-0001-001-01-K' } );
      expect( time.kwhByDay.calls[ 1 ].args[ 0 ] ).toEqual( { id: 2, location: 'Volta', kin: '001-0001-001-02-K' } );
      done();
    });
  });

  it('should generate a CSV', function( done ) {
    findAll.resolve( stations );
    var kwhResults = { id: 1 };
    kwhDay.resolve( kwhResults );
    createCSV.reject();

    kwhGrowthOverTime()
    .catch(function( error ) {
      expect( csv.generateCSV ).toHaveBeenCalled();
      expect( Array.isArray( csv.generateCSV.calls[ 0 ].args[ 0 ] ) ).toBe( true );
      expect( csv.generateCSV.calls[ 0 ].args[ 0 ] ).toEqual( [ kwhResults, kwhResults ] );
      // fields and field names should match
      expect( csv.generateCSV.calls[ 0 ].args[ 1 ] ).toEqual( csv.generateCSV.calls[ 0 ].args[ 2 ] );
      done();
    });
  });
});