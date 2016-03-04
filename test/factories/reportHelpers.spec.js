var reportHelpers = require( '../../factories/reportHelpers.js' );
var Q = require( 'q' );
var db = require( '../../models/index.js' );
var csv = require( '../../factories/csvFactory.js' );
var moment = require( 'moment' );
moment().format();

module.exports = function() {
  ddescribe('reportHelpers.js', function() {
    describe('orderByKin', function() {
      var orderByKin = reportHelpers.orderByKin;
      var collectionOfStations;

      beforeEach(function(  ) {
        collectionOfStations = [ { kin: '001-0002-001-01-K' }, { kin: '001-0001-001-02-K' }, { kin: '001-0001-001-01-K' } ];
      });

      it('should be defined as a function', function() {
        expect( typeof orderByKin ).toBe( 'function' );
      });

      it('should return an array', function() {
        expect( typeof orderByKin( collectionOfStations ) ).toBe( 'object' );
        expect( Array.isArray( orderByKin( collectionOfStations ) ) ).toBe( true );
      });

      it('should sort kins alphabetically', function() {
        expect( orderByKin( collectionOfStations ) ).toEqual( [ { kin: '001-0001-001-01-K' }, { kin: '001-0001-001-02-K' }, { kin: '001-0002-001-01-K' } ] );
      });

      it('should force everything to lowercase, then compare', function() {
        collectionOfStations[ 2 ].kin = '001-0001-001-01-k';
        expect( orderByKin( collectionOfStations ) ).toEqual( [ { kin: '001-0001-001-01-k' }, { kin: '001-0001-001-02-K' }, { kin: '001-0002-001-01-K' } ] );
      });
    });

    describe('findMedian', function() {
      var findMedian = reportHelpers.findMedian;

      it('should be defined as a function', function() {
        expect( typeof findMedian ).toBe( 'function' );
      });

      it('should return a number', function() {
        expect( typeof findMedian( [ 1, 2, 3 ] ) ).toBe( 'number' );
      });

      it('should return a median for an odd number of inputs', function() {
        expect( findMedian( [ 1, 2, 3 ] ) ).toBe( 2 );
      });

      it('should return a median for an even number of inputs', function() {
        expect( findMedian( [ 1, 2, 3, 4 ] ) ).toBe( 2.5 );
      });
    });

    describe('calculateChargeEventDuration', function() {
      var calculateChargeEventDuration = reportHelpers.calculateChargeEventDuration;
      var chargeEvent;

      beforeEach(function() {
        chargeEvent = {
          time_start: moment().subtract( 23, 'minutes' ).toDate(),
          time_stop: moment().toDate()
        };
      });

      it('should be defined as a function', function() {
        expect( typeof calculateChargeEventDuration ).toBe( 'function' );
      });

      it('should return a number', function() {
        expect( typeof calculateChargeEventDuration( chargeEvent ) ).toBe( 'number' );
      });

      it('should return number of minutes spent charging', function() {
        expect( calculateChargeEventDuration( chargeEvent ) ).toBe( 23 );
      });
    });

    describe('convertKwhToConsumerEquivalents', function() {
      var convertKwhToConsumerEquivalents = reportHelpers.convertKwhToConsumerEquivalents;

      it('should be defined as a function', function() {
        expect( typeof convertKwhToConsumerEquivalents ).toBe( 'function' );
      });

      it('should return an object', function() {
        expect( typeof convertKwhToConsumerEquivalents( 12.3 ) ).toBe( 'object' );
        expect( Array.isArray( convertKwhToConsumerEquivalents( 12.3 ) ) ).toBe( false );
      });

      describe('should calculate', function() {
        var result = convertKwhToConsumerEquivalents( 12.3 );

        it('CO2 offset', function() {
          expect( result.hasOwnProperty( 'offset' ) ).toBe( true );
          expect( typeof result.offset ).toBe( 'number' );
          expect( result.offset ).toBe( 18.7 );
        });

        it('gallons of gas saved', function() {
          expect( result.hasOwnProperty( 'gallons' ) ).toBe( true );
          expect( typeof result.gallons ).toBe( 'number' );
          expect( result.gallons ).toBe( 0.9 );
        });

        it('trees planted', function() {
          expect( result.hasOwnProperty( 'trees' ) ).toBe( true );
          expect( typeof result.trees ).toBe( 'number' );
          expect( result.trees ).toBe( 0.2 );
        });

        it('equivalent eV miles driven', function() {
          expect( result.hasOwnProperty( 'miles' ) ).toBe( true );
          expect( typeof result.miles ).toBe( 'number' );
          expect( result.miles ).toBe( 43.1 );
        });
      });
    });

    describe('countChargesAndDuration', function() {
      var countChargesAndDuration = reportHelpers.countChargesAndDuration;

      var chargeEvents = [
        {
          time_start: new Date( 'Mon Feb 29 2016 16:00:00 GMT-0800 (PST)' ),
          time_stop: new Date( 'Mon Feb 29 2016 16:35:00 GMT-0800 (PST)' ),
          // 35 mins
          kwh: 12.3
        },
        {
          time_start: new Date( 'Mon Feb 29 2016 17:00:00 GMT-0800 (PST)' ),
          time_stop: new Date( 'Mon Feb 29 2016 17:18:00 GMT-0800 (PST)' ),
          // 18 mins
          kwh: 5.1
        },
        {
          time_start: new Date( 'Tue Mar 01 2016 15:33:00 GMT-0800 (PST)' ),
          time_stop: new Date( 'Tue Mar 01 2016 16:33:00 GMT-0800 (PST)' ),
          // 60 mins
          kwh: 2.2
        },
        {
          time_start: new Date( 'Fri Mar 04 2016 16:30:00 GMT-0800 (PST)' ),
          time_stop: new Date( 'Fri Mar 04 2016 17:33:00 GMT-0800 (PST)' ),
          // 63 mins
          kwh: 1.2
        }
      ];

      it('should be defined as a function', function() {
        expect( typeof countChargesAndDuration ).toBe( 'function' );
      });

      it('should throw an error if passed no charge events', function() {
        expect( function() { countChargesAndDuration(); } ).toThrow();
      });

      it('should return an object', function() {
        expect( typeof countChargesAndDuration( chargeEvents ) ).toBe( 'object' );
        expect( Array.isArray( countChargesAndDuration( chargeEvents ) ) ).toBe( false );
      });

      it('should call calculateChargeEventDuration', function() {
        spyOn( reportHelpers, 'calculateChargeEventDuration' ).andCallThrough();
        countChargesAndDuration( chargeEvents );
        expect( reportHelpers.calculateChargeEventDuration.calls.length ).toBe( 4 );
      });

      describe('should calculate', function() {
        var result = countChargesAndDuration( chargeEvents );

        it('totalChargeEventDays', function() {
          expect( result.hasOwnProperty( 'totalChargeEventDays' ) ).toBe( true );
          expect( typeof result.totalChargeEventDays ).toBe( 'number' );
          expect( result.totalChargeEventDays ).toBe( 3 );
        });

        it('cumulativeKwh', function() {
          expect( result.hasOwnProperty( 'cumulativeKwh' ) ).toBe( true );
          expect( typeof result.cumulativeKwh ).toBe( 'number' );
          expect( result.cumulativeKwh ).toBe( 20.8 );
        });

        it('averageChargeEventsPerDay', function() {
          expect( result.hasOwnProperty( 'averageChargeEventsPerDay' ) ).toBe( true );
          expect( typeof result.averageChargeEventsPerDay ).toBe( 'number' );
          expect( result.averageChargeEventsPerDay ).toBe( 1 );
        });

        it('medianChargeEventsPerDay', function() {
          expect( result.hasOwnProperty( 'medianChargeEventsPerDay' ) ).toBe( true );
          expect( typeof result.medianChargeEventsPerDay ).toBe( 'number' );
          expect( result.medianChargeEventsPerDay ).toBe( 2 );
        });

        it('averageDurationOfEvent', function() {
          expect( result.hasOwnProperty( 'averageDurationOfEvent' ) ).toBe( true );
          expect( typeof result.averageDurationOfEvent ).toBe( 'number' );
          expect( result.averageDurationOfEvent ).toBe( 44 );
        });

        it('medianDurationOfEvent', function() {
          expect( result.hasOwnProperty( 'medianDurationOfEvent' ) ).toBe( true );
          expect( typeof result.medianDurationOfEvent ).toBe( 'number' );
          expect( result.medianDurationOfEvent ).toBe( 48 );
        });

        it('averageKwhOfEvent', function() {
          expect( result.hasOwnProperty( 'averageKwhOfEvent' ) ).toBe( true );
          expect( typeof result.averageKwhOfEvent ).toBe( 'number' );
          expect( result.averageKwhOfEvent ).toBe( 5.2 );
        });

        it('medianKwhOfEvent', function() {
          expect( result.hasOwnProperty( 'medianKwhOfEvent' ) ).toBe( true );
          expect( typeof result.medianKwhOfEvent ).toBe( 'number' );
          expect( result.medianKwhOfEvent ).toBe( 3.6 );
        });
      });
    });

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
        stations[ 1 ].network = 'NSA';
        expect( function() { standardizeNetworkInfo( stations ); } ).toThrow( new Error ( 'Did not account for network NSA' ) );
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

        it('should change SB into LA and Los Angeles', function() {
          stations[ 0 ].network = 'SB';
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
};