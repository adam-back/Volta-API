var reportHelpers = require( '../../factories/reportHelpers.js' );
var Q = require( 'q' );
var db = require( '../../models/index.js' );
var csv = require( '../../factories/csvFactory.js' );
var moment = require( 'moment' );
moment().format();
var async = require( 'async' );
var ekmFactory = require( '../../factories/ekmFactory.js' );

module.exports = function() {
  describe('reportHelpers.js', function() {
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

        it('totalChargeEvents', function() {
          expect( result.hasOwnProperty( 'totalChargeEvents' ) ).toBe( true );
          expect( typeof result.totalChargeEvents ).toBe( 'number' );
          expect( result.totalChargeEvents ).toBe( 4 );
        });

        it('firstChargeEvent', function() {
          expect( result.hasOwnProperty( 'firstChargeEvent' ) ).toBe( true );
          expect( typeof result.firstChargeEvent ).toBe( 'string' );
          expect( result.firstChargeEvent ).toBe( 'Feb 29, 2016' );
        });

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

    describe('getBrokenPlugs', function() {
      var getBrokenPlugs = reportHelpers.getBrokenPlugs;
      var findPlugs, findStation, plug1, station1;

      beforeEach(function() {
        plug1 = {
          id: 1,
          number_on_station: 1,
          ekm_omnimeter_serial: 'A',
          station_id: 1
        };
        station1 = {
          kin: '001-0001-001-01-K',
          location: 'Home',
          location_address: '123 Main',
          network: 'NoCal',
          ekm_push_mac: 'B'
        };
        findPlugs = Q.defer();
        findStation = Q.defer();
        spyOn( db.plug, 'findAll' ).andReturn( findPlugs.promise );
        spyOn( db.station, 'findOne' ).andReturn( findStation.promise );
      });

      it('should be defined as a function', function() {
        expect( typeof getBrokenPlugs ).toBe( 'function' );
      });

      it('should find all plugs', function( done ) {
        findPlugs.reject();
        getBrokenPlugs()
        .catch(function() {
          expect( db.plug.findAll ).toHaveBeenCalled();
          expect( db.plug.findAll ).toHaveBeenCalledWith( { where: { meter_status: 'error', ekm_omnimeter_serial: { $ne: null } }, raw: true });
          done();
        });
      });

      it('should loop through all plugs', function( done ) {
        findPlugs.resolve( [ plug1, plug1 ] );
        spyOn( async, 'each' ).andCallThrough();
        findStation.reject( 'Test' );
        getBrokenPlugs()
        .catch(function() {
          expect( async.each ).toHaveBeenCalled();
          expect( async.each.calls[ 0 ].args[ 0 ] ).toEqual( [ plug1, plug1 ] );
          done();
        });
      });

      it('should find plug\'s station', function( done ) {
        findPlugs.resolve( [ plug1, plug1 ] );
        findStation.reject( 'Test' );
        getBrokenPlugs()
        .catch(function() {
          expect( db.station.findOne ).toHaveBeenCalled();
          expect( db.station.findOne.calls[ 0 ].args ).toEqual( [ { where: { id: 1 }, raw: true } ] );
          done();
        });
      });

      it('should return array with coalated station and plug data', function( done ) {
        spyOn( ekmFactory, 'makeMeterUrl' ).andReturn( 'http://someurl.com' );
        var data = {
          kin: '001-0001-001-01-K',
          location: 'Home',
          location_address: '123 Main',
          network: 'NoCal',
          ekm_omnimeter_serial: 'A',
          ekm_push_mac: 'B',
          number_on_station: 1,
          ekm_url: 'http://someurl.com'
        };
        findPlugs.resolve( [ plug1, plug1 ] );
        findStation.resolve( station1 );
        getBrokenPlugs()
        .then(function( result ) {
          expect( Array.isArray( result ) ).toBe( true );
          expect( result.length ).toBe( 2 );
          expect( ekmFactory.makeMeterUrl ).toHaveBeenCalled();
          expect( ekmFactory.makeMeterUrl ).toHaveBeenCalledWith( 'A' );
          expect( result[ 0 ] ).toEqual( data );
          done();
        })
        .catch(function( error ) {
          expect( error ).not.toBeDefined();
          done();
        });
      });

      it('should throw error if no station found for plug', function( done ) {
        findPlugs.resolve( [ plug1, plug1 ] );
        findStation.resolve( null );
        getBrokenPlugs()
        .catch(function( error ) {
          expect( error ).toEqual( new Error( 'No station for plug id 1' ) );
          done();
        });
      });
    });

    describe('chargeEventsOverTime', function() {
      var chargeEventsOverTime = reportHelpers.chargeEventsOverTime;
      var timePeriod, findChargeEvents;

      beforeEach(function() {
        timePeriod = [ 1, 'days' ];
        findChargeEvents = Q.defer();
        spyOn( db.charge_event, 'findAll' ).andReturn( findChargeEvents.promise );
      });

      it('should be defined as a function', function() {
        expect( typeof chargeEventsOverTime ).toBe( 'function' );
      });

      it('should return a promise', function( done ) {
        var result = chargeEventsOverTime( null, timePeriod );
        expect( Q.isPromise( result ) ).toBe( true );
        done();
      });

      it('should find all charge events', function( done ) {
        findChargeEvents.reject();
        chargeEventsOverTime( null, timePeriod )
        .catch(function() {
          expect( db.charge_event.findAll ).toHaveBeenCalled();
          done();
        });
      });

      it('should construct query user-passed WHERE', function( done ) {
        findChargeEvents.reject();
        chargeEventsOverTime( { where: { id: 1 } }, timePeriod )
        .catch(function() {
          expect( db.charge_event.findAll ).toHaveBeenCalledWith( { where: { id: 1, time_stop: { $ne: null } }, order: 'id', raw: true } );
          done();
        });
      });

      it('should construct query if one is not provided', function( done ) {
        findChargeEvents.reject();
        chargeEventsOverTime( null, timePeriod )
        .catch(function() {
          expect( db.charge_event.findAll ).toHaveBeenCalledWith( { where: { time_stop: { $ne: null } }, order: 'id', raw: true } );
          done();
        });
      });

      it('should return array with accumulators over the time interval', function( done ) {
        var chargeEvents = [];

        // 5-16 @ 12a to 5-16 @ 12:30a
        chargeEvents.push( { time_start: moment( '2015 05 16', 'YYYY MM DD' ).toDate(), time_stop: moment( '2015 05 16', 'YYYY MM DD' ).add( 30, 'minutes' ).toDate(), kwh: 5.2 } );
        // 5-17 @ 1a to 5-17 @ 2:05a
        chargeEvents.push( { time_start: moment( '2015 05 17', 'YYYY MM DD' ).add( 1, 'hours' ).toDate(), time_stop: moment( '2015 05 17', 'YYYY MM DD' ).add( 2, 'hours' ).add( 5, 'minutes' ).toDate(), kwh: 2.1 } );
        // 5-17 @ 4a to 5-17 @ 5a
        chargeEvents.push( { time_start: moment( '2015 05 17', 'YYYY MM DD' ).add( 4, 'hours' ).toDate(), time_stop: moment( '2015 05 17', 'YYYY MM DD' ).add( 5, 'hours' ).toDate(), kwh: 1.5 } );
        // skip one day
        // 5-19 @ 12a to 5-17 @ 2a
        chargeEvents.push( { time_start: moment( '2015 05 19', 'YYYY MM DD' ).toDate(), time_stop: moment( '2015 05 19', 'YYYY MM DD' ).add( 2, 'hours' ).toDate(), kwh: 10 } );

        findChargeEvents.resolve( chargeEvents );
        chargeEventsOverTime( null, timePeriod )
        .then(function( result ) {
          expect( Array.isArray( result ) ).toBe( true );
          expect( result.length ).toBe( 3 );
          expect( typeof result[ 0 ] ).toBe( 'object' );
          expect( result[ 0 ] ).toEqual( { time: moment( '2015 05 17', 'YYYY MM DD' ).toDate(), events: 1, kwh: 5.2 } );
          expect( result[ 1 ] ).toEqual( { time: moment( '2015 05 18', 'YYYY MM DD' ).toDate(), events: 3, kwh: 8.8 } );
          expect( result[ 2 ] ).toEqual( { time: moment( '2015 05 20', 'YYYY MM DD' ).toDate(), events: 4, kwh: 18.8 } );
          done();
        })
        .catch(function( error ) {
          expect( error ).not.toBeDefined();
          done();
        });
      });
    });

    describe('chargesOverLastThirtyDaysForOneStation', function() {
      var chargesOverLastThirtyDaysForOneStation = reportHelpers.chargesOverLastThirtyDaysForOneStation;
      var findChargeEvents;
      var station1 = {
        id: 1,
        kin: '001-0001-001-01-K',
        location: 'Home'
      };
      var averagesAndMedians = {
        totalChargeEvents: 1,
        firstChargeEvent: 2,
        totalChargeEventDays: 3,
        cumulativeKwh: 4,
        averageChargeEventsPerDay: 5,
        medianChargeEventsPerDay: 6,
        averageDurationOfEvent: 7,
        medianDurationOfEvent: 8,
        averageKwhOfEvent: 9,
        medianKwhOfEvent: 10
      };
      var conversions = {
        offset: 11,
        miles: 14,
        trees: 13,
        gallons: 12
      };

      beforeEach(function() {
        findChargeEvents = Q.defer();
        spyOn( db.charge_event, 'findAll' ).andReturn( findChargeEvents.promise );
        spyOn( reportHelpers, 'countChargesAndDuration' ).andReturn( averagesAndMedians );
        spyOn( reportHelpers, 'convertKwhToConsumerEquivalents' ).andReturn( conversions );
      });

      it('should be defined as a function', function() {
        expect( typeof chargesOverLastThirtyDaysForOneStation ).toBe( 'function' );
      });

      it('should return a promise', function( done ) {
        var result = chargesOverLastThirtyDaysForOneStation( station1 );
        expect( Q.isPromise( result ) ).toBe( true );
        done();
      });

      it('should find all charge events for last 30 days', function( done ) {
        findChargeEvents.reject();
        chargesOverLastThirtyDaysForOneStation( station1 )
        .catch(function() {
          expect( db.charge_event.findAll ).toHaveBeenCalled();
          expect( db.charge_event.findAll.calls[ 0 ].args[ 0 ].hasOwnProperty( 'where' ) ).toBe( true );
          expect( db.charge_event.findAll.calls[ 0 ].args[ 0 ].where.station_id ).toBe( 1 );
          // can't really test date directly
          expect( db.charge_event.findAll.calls[ 0 ].args[ 0 ].where.time_start[ '$gt' ] ).toBeDefined();
          expect( db.charge_event.findAll.calls[ 0 ].args[ 0 ].where.time_stop[ '$ne' ] ).toBe( null );
          expect( db.charge_event.findAll.calls[ 0 ].args[ 0 ].hasOwnProperty( 'raw' ) ).toBe( true );
          expect( db.charge_event.findAll.calls[ 0 ].args[ 0 ].raw ).toBe( true );
          expect( db.charge_event.findAll.calls[ 0 ].args[ 0 ].hasOwnProperty( 'order' ) ).toBe( true );
          expect( db.charge_event.findAll.calls[ 0 ].args[ 0 ].order ).toEqual( [ [ 'time_start', 'ASC' ] ] );
          done();
        });
      });

      it('should make various calcs and return object for CSV', function( done ) {
        var oneEvent = { time_start: moment().toDate() };
        findChargeEvents.resolve( [ oneEvent ] );
        chargesOverLastThirtyDaysForOneStation( station1 )
        .then(function( result ) {
          expect( typeof result ).toBe( 'object' );
          expect( Array.isArray( result ) ).toBe( false );
          expect( reportHelpers.countChargesAndDuration ).toHaveBeenCalled();
          expect( reportHelpers.countChargesAndDuration ).toHaveBeenCalledWith( [ oneEvent ] );
          expect( reportHelpers.convertKwhToConsumerEquivalents ).toHaveBeenCalled();
          expect( reportHelpers.convertKwhToConsumerEquivalents ).toHaveBeenCalledWith( 4 );
          expect( result.hasOwnProperty( 'kin' ) ).toBe( true );
          expect( result.hasOwnProperty( 'location' ) ).toBe( true );
          expect( result.hasOwnProperty( 'since' ) ).toBe( true );
          // cumulative kWh
          expect( result.hasOwnProperty( 'kWh' ) ).toBe( true );
          expect( result.hasOwnProperty( 'carbon' ) ).toBe( true );
          expect( result.hasOwnProperty( 'miles' ) ).toBe( true );
          expect( result.hasOwnProperty( 'trees' ) ).toBe( true );
          expect( result.hasOwnProperty( 'gallons' ) ).toBe( true );
          // charge events
          expect( result.hasOwnProperty( 'numberOfCharges' ) ).toBe( true );
          expect( result.hasOwnProperty( 'averageChargeEventsPerDay' ) ).toBe( true );
          expect( result.hasOwnProperty( 'medianChargeEventsPerDay' ) ).toBe( true );
          expect( result.hasOwnProperty( 'averageDurationOfEvent' ) ).toBe( true );
          expect( result.hasOwnProperty( 'medianDurationOfEvent' ) ).toBe( true );
          // Average kwh per event
          expect( result.hasOwnProperty( 'averageKwhOfEvent' ) ).toBe( true );
          expect( result.hasOwnProperty( 'averageCarbonPerEvent' ) ).toBe( true );
          expect( result.hasOwnProperty( 'averageMilesPerEvent' ) ).toBe( true );
          expect( result.hasOwnProperty( 'averageTreesPerEvent' ) ).toBe( true );
          expect( result.hasOwnProperty( 'averageGallonsPerEvent' ) ).toBe( true );
          // Median kwh per event
          expect( result.hasOwnProperty( 'medianKwhOfEvent' ) ).toBe( true );
          expect( result.hasOwnProperty( 'medianCarbonPerEvent' ) ).toBe( true );
          expect( result.hasOwnProperty( 'medianMilesPerEvent' ) ).toBe( true );
          expect( result.hasOwnProperty( 'medianTreesPerEvent' ) ).toBe( true );
          expect( result.hasOwnProperty( 'medianGallonsPerEvent' ) ).toBe( true );

          expect( result.kin ).toBe( '001-0001-001-01-K' );
          expect( result.location ).toBe( 'Home' );
          expect( result.since ).toBe( moment().format( 'MMM D, YYYY' ) );
          // cumulative kWh
          expect( result.kWh ).toBe( 4 );
          expect( result.carbon ).toBe( 11 );
          expect( result.miles ).toBe( 14 );
          expect( result.trees ).toBe( 13 );
          expect( result.gallons ).toBe( 12 );
          // charge events
          expect( result.numberOfCharges ).toBe( 1 );
          expect( result.averageChargeEventsPerDay ).toBe( 5 );
          expect( result.medianChargeEventsPerDay ).toBe( 6 );
          expect( result.averageDurationOfEvent ).toBe( 7 );
          expect( result.medianDurationOfEvent ).toBe( 8 );
          // Average kwh per event
          expect( result.averageKwhOfEvent ).toBe( 9 );
          expect( result.averageCarbonPerEvent ).toBe( 11 );
          expect( result.averageMilesPerEvent ).toBe( 14 );
          expect( result.averageTreesPerEvent ).toBe( 13 );
          expect( result.averageGallonsPerEvent ).toBe( 12 );
          // Median kwh per event
          expect( result.medianKwhOfEvent ).toBe( 10 );
          expect( result.medianCarbonPerEvent ).toBe( 11 );
          expect( result.medianMilesPerEvent ).toBe( 14 );
          expect( result.medianTreesPerEvent ).toBe( 13 );
          expect( result.medianGallonsPerEvent ).toBe( 12 );
          done();
        })
        .catch(function( error ) {
          expect( error ).not.toBeDefined();
          done();
        });
      });

      it('should return basic station info, even if no charge events', function( done ) {
        var oneEvent = { time_start: moment().toDate() };
        findChargeEvents.resolve( [] );
        chargesOverLastThirtyDaysForOneStation( station1 )
        .then(function( result ) {
          expect( typeof result ).toBe( 'object' );
          expect( Array.isArray( result ) ).toBe( false );
          expect( reportHelpers.countChargesAndDuration ).not.toHaveBeenCalled();
          expect( reportHelpers.convertKwhToConsumerEquivalents ).not.toHaveBeenCalled();
          expect( result.hasOwnProperty( 'kin' ) ).toBe( true );
          expect( result.hasOwnProperty( 'location' ) ).toBe( true );
          expect( result.hasOwnProperty( 'since' ) ).toBe( true );
          // cumulative kWh
          expect( result.hasOwnProperty( 'kWh' ) ).toBe( true );
          expect( result.hasOwnProperty( 'carbon' ) ).toBe( true );
          expect( result.hasOwnProperty( 'miles' ) ).toBe( true );
          expect( result.hasOwnProperty( 'trees' ) ).toBe( true );
          expect( result.hasOwnProperty( 'gallons' ) ).toBe( true );
          // charge events
          expect( result.hasOwnProperty( 'numberOfCharges' ) ).toBe( true );
          expect( result.hasOwnProperty( 'averageChargeEventsPerDay' ) ).toBe( true );
          expect( result.hasOwnProperty( 'medianChargeEventsPerDay' ) ).toBe( true );
          expect( result.hasOwnProperty( 'averageDurationOfEvent' ) ).toBe( true );
          expect( result.hasOwnProperty( 'medianDurationOfEvent' ) ).toBe( true );
          // Average kwh per event
          expect( result.hasOwnProperty( 'averageKwhOfEvent' ) ).toBe( true );
          expect( result.hasOwnProperty( 'averageCarbonPerEvent' ) ).toBe( true );
          expect( result.hasOwnProperty( 'averageMilesPerEvent' ) ).toBe( true );
          expect( result.hasOwnProperty( 'averageTreesPerEvent' ) ).toBe( true );
          expect( result.hasOwnProperty( 'averageGallonsPerEvent' ) ).toBe( true );
          // Median kwh per event
          expect( result.hasOwnProperty( 'medianKwhOfEvent' ) ).toBe( true );
          expect( result.hasOwnProperty( 'medianCarbonPerEvent' ) ).toBe( true );
          expect( result.hasOwnProperty( 'medianMilesPerEvent' ) ).toBe( true );
          expect( result.hasOwnProperty( 'medianTreesPerEvent' ) ).toBe( true );
          expect( result.hasOwnProperty( 'medianGallonsPerEvent' ) ).toBe( true );

          expect( result.kin ).toBe( '001-0001-001-01-K' );
          expect( result.location ).toBe( 'Home' );
          expect( result.since ).toBe( '' );
          // cumulative kWh
          expect( result.kWh ).toBe( '' );
          expect( result.carbon ).toBe( '' );
          expect( result.miles ).toBe( '' );
          expect( result.trees ).toBe( '' );
          expect( result.gallons ).toBe( '' );
          // charge events
          expect( result.numberOfCharges ).toBe( '' );
          expect( result.averageChargeEventsPerDay ).toBe( '' );
          expect( result.medianChargeEventsPerDay ).toBe( '' );
          expect( result.averageDurationOfEvent ).toBe( '' );
          expect( result.medianDurationOfEvent ).toBe( '' );
          // Average kwh per event
          expect( result.averageKwhOfEvent ).toBe( '' );
          expect( result.averageCarbonPerEvent ).toBe( '' );
          expect( result.averageMilesPerEvent ).toBe( '' );
          expect( result.averageTreesPerEvent ).toBe( '' );
          expect( result.averageGallonsPerEvent ).toBe( '' );
          // Median kwh per event
          expect( result.medianKwhOfEvent ).toBe( '' );
          expect( result.medianCarbonPerEvent ).toBe( '' );
          expect( result.medianMilesPerEvent ).toBe( '' );
          expect( result.medianTreesPerEvent ).toBe( '' );
          expect( result.medianGallonsPerEvent ).toBe( '' );
          done();
        })
        .catch(function( error ) {
          expect( error ).not.toBeDefined();
          done();
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