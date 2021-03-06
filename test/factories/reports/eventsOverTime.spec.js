var models = require( '../../../models' );
var charge_event = models.charge_event;
var station = models.station;
var time = require( '../../../factories/reports/eventsOverTime.js' );
var Q = require( 'q' );
var moment = require( 'moment' );
moment().format();

module.exports = function() {
  describe('eventsOverTime.js', function() {
    describe('countNumberOfDaysWithoutData', function() {
      var countNumberOfDaysWithoutData = time.countNumberOfDaysWithoutData;
      var first, second;

      beforeEach(function() {
       first = moment( '2015 05 01', 'YYYY MM DD' );
       second = moment( '2015 05 01', 'YYYY MM DD' );
      });

      it('should be defined as a function', function() {
        expect( typeof countNumberOfDaysWithoutData ).toBe( 'function' );
      });

      it('should return an object', function() {
        var result = countNumberOfDaysWithoutData( first, second );
        expect( typeof result ).toBe( 'object' );
        expect( Array.isArray( result ) ).toBe( false );
      });

      it('should return no nulls if there is always days with data', function() {
        second = second.endOf( 'day' );
        var result = countNumberOfDaysWithoutData( first, second );
        expect( Object.keys( result ).length ).toBe( 0 );
      });

      it('should return 1 null if there is one day without data', function() {
        second.add( 2, 'days' ).endOf( 'day' );
        var result = countNumberOfDaysWithoutData( first, second, null );
        expect( Object.keys( result ).length ).toBe( 1 );
        expect( result.hasOwnProperty( '5/2/2015' ) ).toBe( true );
        expect( result[ '5/2/2015' ] ).toBe( null );
      });

      it('should return 3 nulls if there are three days without data', function() {
        second = moment( '2015 05 05', 'YYYY MM DD' ).endOf( 'day' );
        var result = countNumberOfDaysWithoutData( first, second, null );
        expect( Object.keys( result ).length ).toBe( 3 );
        expect( result.hasOwnProperty( '5/2/2015' ) ).toBe( true );
        expect( result.hasOwnProperty( '5/3/2015' ) ).toBe( true );
        expect( result.hasOwnProperty( '5/4/2015' ) ).toBe( true );
        for ( var date in result ) {
          expect( result[ date ] ).toBe( null );
        }
      });
    });

    describe('mergeObjects', function() {
      var mergeObjects = time.mergeObjects;
      var master = {
        name: 'Adam',
        age: 27
      };
      var additions = {
        hair: 'brown',
        eyes: 'blue'
      };

      it('should be defined as a function', function() {
        expect( typeof mergeObjects ).toBe( 'function' );
      });

      it('should return an object', function() {
        var result = mergeObjects( master, additions );
        expect( typeof result ).toBe( 'object' );
        expect( Array.isArray( result ) ).toBe( false );
      });

      it('should merge the two objects', function() {
        var result = mergeObjects( master, additions );
        expect( Object.keys( result ).length ).toBe( 4 );
        expect( result.name ).toBe( 'Adam' );
        expect( result.age ).toBe( 27 );
        expect( result.hair ).toBe( 'brown' );
        expect( result.eyes ).toBe( 'blue' );
      });
    });

    describe('kwhByDay', function() {
      var kwhByDay = time.kwhByDay;
      var count, findAll;
      var station = { id: 1, location: 'home', kin: '001-0001-001-01-K' };
      var chargeEvents;
      var daysSinceMay16 = moment().diff( moment( '2015 05 16', 'YYYY MM DD' ), 'days' );
      var today = moment().format( 'M/D/YYYY' );

      beforeEach(function() {
        count = Q.defer();
        findAll = Q.defer();
        spyOn( charge_event, 'count' ).andReturn( count.promise );
        spyOn( charge_event, 'findAll' ).andReturn( findAll.promise );

        chargeEvents = [];
        chargeEvents.push( { time_start: moment( '2015 05 16', 'YYYY MM DD' ).toDate(), kwh: 2 } );
      });

      it('should be defined as a function', function() {
        expect( typeof kwhByDay ).toBe( 'function' );
      });

      it('should count charge events for a station', function( done ) {
        count.reject();
        kwhByDay( station )
        .catch(function() {
          expect( charge_event.count ).toHaveBeenCalled();
          expect( charge_event.count ).toHaveBeenCalledWith( { where: { station_id: 1 } } );
          done();
        });
      });

      it('should return null if the station has no charge events', function( done ) {
        count.resolve( 0 );
        kwhByDay( station )
        .then(function( result ) {
          expect( result ).toBeNull();
          expect( charge_event.findAll ).not.toHaveBeenCalled();
          done();
        });
      });

      it('should find all charge events for a station', function( done ) {
        count.resolve( 1 );
        findAll.reject();
        kwhByDay( station )
        .catch(function() {
          expect( charge_event.findAll ).toHaveBeenCalled();
          expect( charge_event.findAll ).toHaveBeenCalledWith( { where: { station_id: 1, kwh: { $lt: 100 }, time_stop: { $ne: null } }, order: 'time_start', raw: true } );
          done();
        });
      });

      it('should return a JSON object of cumulative kwh by day since May 16, 2015', function( done ) {
        count.resolve( 1 );
        findAll.resolve( chargeEvents );
        kwhByDay( station )
        .then(function( result ) {
          expect( typeof result ).toBe( 'object' );
          expect( Array.isArray( result ) ).toBe( false );
          expect( Object.keys( result ).length ).toBe( daysSinceMay16 + 3 );
          expect( result.location ).toBe( 'home' );
          expect( result.kin ).toBe( '001-0001-001-01-K' );
          expect( result[ '5/16/2015' ] ).toBe( 2 );
          expect( result.hasOwnProperty( today ) ).toBe( true );
          expect( result[ today ] ).toBe( 2 );
          done();
        })
        .catch(function( error ) {
          expect( error ).toBe( 1 );
          done();
        });
      });

      it('should handle multiple, consecutive days', function( done ) {
        chargeEvents.push( { time_start: moment( '2015 05 16', 'YYYY MM DD' ).add( 2, 'hours' ).toDate(), kwh: 1 } );
        chargeEvents.push( { time_start: moment( '2015 05 17', 'YYYY MM DD' ).add( 10, 'hours' ).add( 15, 'minutes' ).toDate(), kwh: 5 } );
        count.resolve( 3 );
        findAll.resolve( chargeEvents );
        kwhByDay( station )
        .then(function( result ) {
         expect( Object.keys( result ).length ).toBe( daysSinceMay16 + 3 );
         expect( result.location ).toBe( 'home' );
         expect( result.kin ).toBe( '001-0001-001-01-K' );
         expect( result[ '5/16/2015' ] ).toBe( 3 );
         expect( result[ '5/17/2015' ] ).toBe( 8 );
         expect( result[ today ] ).toBe( 8 );
         done();
        })
        .catch(function( error ) {
          expect( error ).toBe( 1 );
          done();
        });
      });

      it('should handle multiple, non-consecutive days', function( done ) {
        chargeEvents.push( { time_start: moment( '2015 05 16', 'YYYY MM DD' ).add( 2, 'hours' ).toDate(), kwh: 1 } );
        chargeEvents.push( { time_start: moment( '2015 05 17', 'YYYY MM DD' ).add( 10, 'hours' ).add( 15, 'minutes' ).toDate(), kwh: 5 } );
        // skip the 18th
        chargeEvents.push( { time_start: moment( '2015 05 19', 'YYYY MM DD' ).add( 2, 'hours' ).add( 35, 'minutes' ).toDate(), kwh: 3 } );
        chargeEvents.push( { time_start: moment( '2015 05 20', 'YYYY MM DD' ).add( 6, 'hours' ).add( 59, 'minutes' ).toDate(), kwh: 2 } );
        chargeEvents.push( { time_start: moment( '2015 05 20', 'YYYY MM DD' ).add( 7, 'hours' ).add( 49, 'minutes' ).toDate(), kwh: 4 } );
        count.resolve( 7 );
        findAll.resolve( chargeEvents );
        kwhByDay( station )
        .then(function( result ) {
          expect( Object.keys( result ).length ).toBe( daysSinceMay16 + 3 );
          expect( result.location ).toBe( 'home' );
          expect( result.kin ).toBe( '001-0001-001-01-K' );
          expect( result[ '5/16/2015' ] ).toBe( 3 );
          expect( result[ '5/17/2015' ] ).toBe( 8 );
          expect( result[ '5/18/2015' ] ).toBe( 8 );
          expect( result[ '5/19/2015' ] ).toBe( 11 );
          expect( result[ '5/20/2015' ] ).toBe( 17 );
          expect( result[ today ] ).toBe( 17 );
          done();
        })
        .catch(function( error ) {
          expect( error ).toBe( 1 );
          done();
        });
      });

      it('should start with nulls when data doesn\'t start on May 16', function( done ) {
        chargeEvents.pop();
        chargeEvents.push( { time_start: moment( '2015 05 19', 'YYYY MM DD' ).add( 2, 'hours' ).add( 35, 'minutes' ).toDate(), kwh: 3 } );
        chargeEvents.push( { time_start: moment( '2015 05 19', 'YYYY MM DD' ).add( 3, 'hours' ).add( 35, 'minutes' ).toDate(), kwh: undefined } );
        chargeEvents.push( { time_start: moment( '2015 05 20', 'YYYY MM DD' ).add( 6, 'hours' ).add( 59, 'minutes' ).toDate(), kwh: 2 } );
        chargeEvents.push( { time_start: moment( '2015 05 20', 'YYYY MM DD' ).add( 7, 'hours' ).add( 49, 'minutes' ).toDate(), kwh: 4 } );
        count.resolve( 3 );
        findAll.resolve( chargeEvents );
        kwhByDay( station )
        .then(function( result ) {
          expect( Object.keys( result ).length ).toBe( daysSinceMay16 + 3 );
          expect( result.location ).toBe( 'home' );
          expect( result.kin ).toBe( '001-0001-001-01-K' );
          expect( result[ '5/16/2015' ] ).toBe( null );
          expect( result[ '5/17/2015' ] ).toBe( null );
          expect( result[ '5/18/2015' ] ).toBe( null );
          expect( result[ '5/19/2015' ] ).toBe( 3 );
          expect( result[ '5/20/2015' ] ).toBe( 9 );
          expect( result[ today ] ).toBe( 9 );
          done();
        })
        .catch(function( error ) {
          expect( error ).toBe( 1 );
          done();
        });
      });
    });

    describe('dataOverThirtyDays', function() {
      var dataOverThirtyDays = time.dataOverThirtyDays;
      var findStations, findChargeEvents;

      beforeEach(function() {
        findStations = Q.defer();
        findChargeEvents = Q.defer();
        spyOn( station, 'findAll' ).andReturn( findStations.promise );
        spyOn( charge_event, 'findAll' ).andReturn( findChargeEvents.promise );
      });

      it('should be defined as a function', function() {
        expect( typeof dataOverThirtyDays ).toBe( 'function' );
      });

      it('should return a promise', function( done ) {
        var result = dataOverThirtyDays();
        expect( Q.isPromise( result ) ).toBe( true );
        done();
      });

      it('should find all stations', function( done ) {
        findStations.reject();
        dataOverThirtyDays()
        .catch(function() {
          expect( station.findAll ).toHaveBeenCalled();
          expect( station.findAll ).toHaveBeenCalledWith( { raw: true } );
          done();
        });
      });

      it('should find all charge events in last 30 days', function( done ) {
        findStations.resolve( [] );
        findChargeEvents.reject();
        dataOverThirtyDays()
        .catch(function() {
          expect( charge_event.findAll ).toHaveBeenCalled();
          expect( charge_event.findAll.calls[ 0 ].args[ 0 ].where ).toBeDefined();
          expect( charge_event.findAll.calls[ 0 ].args[ 0 ].where.time_start ).toBeDefined();
          expect( charge_event.findAll.calls[ 0 ].args[ 0 ].where.time_start[ '$gt' ] ).toBeDefined();
          expect( charge_event.findAll.calls[ 0 ].args[ 0 ].where.time_stop ).toEqual( { $ne: null } );
          done();
        });
      });

      it('should return stations with cumulative 30-day data', function( done ) {
        findStations.resolve( [ { id: 1, kin: '001-0001-001-01-K', network: 'LA', location: 'Hollywood' }, { id: 2, kin: '002-0002-002-02-K', network: 'LA', location: 'Brea' } ] );
        var chargeEvents = [];

        // Station 1: 5-16 @ 12a to 5-16 @ 12:30a for 30 minutes
        chargeEvents.push( { time_start: moment( '2015 05 16', 'YYYY MM DD' ).toDate(), time_stop: moment( '2015 05 16', 'YYYY MM DD' ).add( 30, 'minutes' ).toDate(), kwh: 5.2, station_id: 1 } );
        // Station 2: 5-17 @ 1a to 5-17 @ 2:05a for 65 minutes
        chargeEvents.push( { time_start: moment( '2015 05 17', 'YYYY MM DD' ).add( 1, 'hours' ).toDate(), time_stop: moment( '2015 05 17', 'YYYY MM DD' ).add( 2, 'hours' ).add( 5, 'minutes' ).toDate(), kwh: 2.1, station_id: 2 } );
        // Station 1: 5-17 @ 4a to 5-17 @ 5a for 60 minutes
        chargeEvents.push( { time_start: moment( '2015 05 17', 'YYYY MM DD' ).add( 4, 'hours' ).toDate(), time_stop: moment( '2015 05 17', 'YYYY MM DD' ).add( 5, 'hours' ).toDate(), kwh: 1.5, station_id: 1  } );
        // Station 1: 5-17 @ 6a to 5-17 @ 7a for 60 minutes
        chargeEvents.push( { time_start: moment( '2015 05 17', 'YYYY MM DD' ).add( 6, 'hours' ).toDate(), time_stop: moment( '2015 05 17', 'YYYY MM DD' ).add( 7, 'hours' ).toDate(), kwh: 1, station_id: 1  } );
        // skip one day
        // Station 1: 5-19 @ 12a to 5-17 @ 2a for 120 minutes
        chargeEvents.push( { time_start: moment( '2015 05 19', 'YYYY MM DD' ).toDate(), time_stop: moment( '2015 05 19', 'YYYY MM DD' ).add( 2, 'hours' ).toDate(), kwh: 10, station_id: 1 } );

        findChargeEvents.resolve( chargeEvents );

        dataOverThirtyDays()
        .then(function( result ) {
          expect( result[ '1' ].kwh ).toBe( 17.7 );
          expect( result[ '1' ].events ).toBe( 4 );
          expect( result[ '1' ].time_spent_charging ).toBe( 270 );
          expect( result[ '1' ].median_charge_events_per_day ).toBe( 0 );
          expect( result[ '1' ].median_session_length ).toBe( 60 );
          expect( result[ '1' ].session_lengths ).toEqual( [ 30, 60, 60, 120 ] );
          expect( result[ '1' ].charge_events.length ).toBe( 30 );
          expect( result[ '1' ].charge_events ).toEqual( [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2 ] );


          expect( result[ '2' ].kwh ).toBe( 2.1 );
          expect( result[ '2' ].events ).toBe( 1 );
          expect( result[ '2' ].time_spent_charging ).toBe( 65 );
          expect( result[ '2' ].median_charge_events_per_day ).toBe( 0 );
          expect( result[ '2' ].median_session_length ).toBe( 65 );
          expect( result[ '2' ].session_lengths ).toEqual( [ 65 ] );
          expect( result[ '2' ].charge_events.length ).toBe( 30 );
          expect( result[ '2' ].charge_events ).toEqual( [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1 ] );
          done();
        })
        .catch(function( error ) {
          expect( error ).not.toBeDefined();
          done();
        });
      });

      it('should delete stations which have no charge events', function( done ) {
        findStations.resolve( [ { id: 1, kin: '001-0001-001-01-K', network: 'LA', location: 'Hollywood' }, { id: 2, kin: '002-0002-002-02-K', network: 'LA', location: 'Brea' } ] );
        var chargeEvents = [];

        // 5-16 @ 12a to 5-16 @ 12:30a for 30 minutes
        chargeEvents.push( { time_start: moment( '2015 05 16', 'YYYY MM DD' ).toDate(), time_stop: moment( '2015 05 16', 'YYYY MM DD' ).add( 30, 'minutes' ).toDate(), kwh: 5.2, station_id: 1 } );
        // 5-17 @ 1a to 5-17 @ 2:05a for 65 minutes
        chargeEvents.push( { time_start: moment( '2015 05 17', 'YYYY MM DD' ).add( 1, 'hours' ).toDate(), time_stop: moment( '2015 05 17', 'YYYY MM DD' ).add( 2, 'hours' ).add( 5, 'minutes' ).toDate(), kwh: 2.1, station_id: 3 } );
        // 5-17 @ 4a to 5-17 @ 5a for 65 minutes
        chargeEvents.push( { time_start: moment( '2015 05 17', 'YYYY MM DD' ).add( 4, 'hours' ).toDate(), time_stop: moment( '2015 05 17', 'YYYY MM DD' ).add( 5, 'hours' ).toDate(), kwh: 1.5, station_id: 1  } );
        // skip one day
        // 5-19 @ 12a to 5-17 @ 2a for 120 minutes
        chargeEvents.push( { time_start: moment( '2015 05 19', 'YYYY MM DD' ).toDate(), time_stop: moment( '2015 05 19', 'YYYY MM DD' ).add( 2, 'hours' ).toDate(), kwh: 10, station_id: 1 } );

        findChargeEvents.resolve( chargeEvents );
        dataOverThirtyDays()
        .then(function( result ) {
          expect( result[ '1' ].kwh ).toBe( 16.7 );
          expect( result[ '1' ].events ).toBe( 3 );
          expect( result[ '1' ].time_spent_charging ).toBe( 210 );
          expect( result.hasOwnProperty( '2' ) ).toBe( false );
          expect( result.hasOwnProperty( '3' ) ).toBe( false );
          done();
        })
        .catch(function( error ) {
          expect( error ).not.toBeDefined();
          done();
        });
      });

      it('should throw error if network is not correct', function( done ) {
        findStations.resolve( [ { id: 1, kin: '001-0001-001-01-K', network: 'LA', location: 'Hollywood' }, { id: 2, kin: '002-0002-002-02-K', network: 'OC', location: 'Brea' } ] );
        var chargeEvents = [];
        // 5-16 @ 12a to 5-16 @ 12:30a for 30 minutes
        chargeEvents.push( { time_start: moment( '2015 05 16', 'YYYY MM DD' ).toDate(), time_stop: moment( '2015 05 16', 'YYYY MM DD' ).add( 30, 'minutes' ).toDate(), kwh: 5.2, station_id: 2 } );

        findChargeEvents.resolve( chargeEvents );
        dataOverThirtyDays()
        .then(function( result ) {
          expect( result ).not.toBeDefined();
          done();
        })
        .catch(function( error ) {
          expect( error.message ).toBe( 'Network (OC) not found in global median data object, eventOverTime.dataOverThirtyDays.' );
          done();
        });
      });
    });
  });
};