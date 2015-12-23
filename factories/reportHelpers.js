var moment = require( 'moment' );
moment().format();
var Q = require( 'q' );
var station = require( '../models').station;
var plug = require( '../models').plug;
var charge_event = require( '../models').charge_event;
var async     = require( 'async' );
var ekm = require( './ekmFactory.js' );

exports.findMedian = function( collection ) {
  collection.sort(function( a, b ) {
    return a - b;
  });

  var half = Math.floor( collection.length / 2 );

  if( collection.length % 2 ) {
    return collection[ half ];
  } else {
    return ( collection[ half - 1 ] + collection[ half ] ) / 2.0;
  }
};

exports.calculateChargeEventDuration = function( chargeEvent ) {
  // return number of minutes during the charge event, rounded to the nearest minute
  // ms / 1000 = seconds
  // seconds / 60 = minutes
  return Math.round( ( ( ( chargeEvent.time_stop - chargeEvent.time_start ) / 1000 ) / 60 ) * 10 ) / 10;
};

exports.convertKwhToConsumerEquivalents = function( kwh ) {
  var data = {};
  // based off of calculations from the EPA
  // http://www.epa.gov/cleanenergy/energy-resources/calculator.html
  data.offset = Math.round( 10 * ( kwh * 1.52 ) ) / 10;
  data.gallons = Math.round( 10 * ( kwh * 0.0766666 ) ) / 10;
  data.trees = Math.round( kwh * 0.01766666 );
  // Avg. Nissan Leaf from http://insideevs.com/long-term-nissan-leaf-mileageusage-review-once-around-the-sun/
  data.miles = Math.round( 10 * ( kwh * 5.44 ) ) / 10;
  return data;
};

exports.countChargesAndDuration = function( chargeEvents ) {
  var data = {};
  // save the total charge events
  data.totalChargeEvents = chargeEvents.length;
  // save the first day
  data.firstChargeEvent = moment( new Date( chargeEvents[ 0 ].time_start ) ).format( 'MMM D, YYYY' );

  ////////////
  // COUNT //
  // number of days
  // number of charge events for each day
  // total duration of usage
  // durations for each
  var currentDay = moment( new Date( chargeEvents[ 0 ].time_start ) );
  var numberOfDays = 1;
  var chargeEventsForTheDay = 1;
  var chargeEventsByDay = [];
  var totalChargeDuration = 0;
  var chargeDurations = [];
  var lengthOfCharge = exports.calculateChargeEventDuration( chargeEvents[ 0 ] );
  totalChargeDuration += lengthOfCharge;
  chargeDurations.push( lengthOfCharge );

  for ( var i = 1; i < chargeEvents.length; i++ ) {
    var eventTime = moment( new Date( chargeEvents[ i ].time_start ) );
    lengthOfCharge = exports.calculateChargeEventDuration( chargeEvents[ i ] );
    totalChargeDuration += lengthOfCharge;
    chargeDurations.push( lengthOfCharge );
    // if it's a new day
    if ( eventTime.isAfter( currentDay, 'day' ) ) {
      numberOfDays++;
      currentDay = eventTime;
      chargeEventsByDay.push( chargeEventsForTheDay );
      // reset for new day
      chargeEventsForTheDay = 1;
    // same day
    } else {
      // one more charge event for the current day
      chargeEventsForTheDay++;
    }
  }
  // save total days
  data.totalChargeEventDays = numberOfDays;

  // average number of events per day
  data.averageChargeEventsPerDay = Math.round( data.totalChargeEvents / data.totalChargeEventDays );
  // median number of events per day
  data.medianChargeEventsPerDay = exports.findMedian( chargeEventsByDay );
  // average duration of charge event
  data.averageDurationOfEvent = Math.round( totalChargeDuration / chargeDurations.length );
  // median duration of charge event
  data.medianDurationOfEvent = exports.findMedian( chargeDurations );

  return true;
};

exports.getBrokenPlugs = function () {
  var deferred = Q.defer();
  var broken = [];

  // find all the plugs where there is an omnimeter and the meter status is error
  plug.findAll( { where: { meter_status: 'error', ekm_omnimeter_serial: { $ne: null } } } )
  .then(function( plugs ) {
    //for each one of the plugs
    async.each(plugs, function( plug, cb ) {
      var data = {
        kin: null,
        location: null,
        location_address: null,
        network: null,
        ekm_omnimeter_serial: plug.ekm_omnimeter_serial,
        ekm_push_mac: null,
        number_on_station: plug.number_on_station,
        ekm_url: null
      };
      // get the station
      station.find( { where: { id: plug.station_id } } )
      .then(function( stationAssociatedWithPlug ) {
        data.kin = stationAssociatedWithPlug.kin;
        data.location = stationAssociatedWithPlug.location;
        data.location_address = stationAssociatedWithPlug.location_address;
        data.network = stationAssociatedWithPlug.network;
        data.ekm_push_mac = stationAssociatedWithPlug.ekm_push_mac;
        data.ekm_url = ekm.makeMeterUrl( plug.ekm_omnimeter_serial );

        broken.push( data );
        cb( null );
      })
      .catch(function( error ) {
        cb( error );
      });
    }, function( error ) {
      if ( error ) {
        throw error;
      } else {
        deferred.resolve( broken );
      }
    });
  })
  .catch(function( error ) {
    deferred.reject( error );
  });

  return deferred.promise;
};

exports.setThirtyMinsInTheFuture = function( time ) {
  return moment( time ).add( 30, 'minutes' );
};
exports.chargeEventsOverTime = function( where ) {
  var where = where || { order: 'id', raw: true };
  var collector = {
    totalEvents: 0,
    kwh: 0
  };
  var periods = [];

  return charge_event.findAll( where )
  .then(function( chargeEvents ) {
    // set the first 30-min period
    var currentPeriod = exports.setThirtyMinsInTheFuture( chargeEvents[ 0 ].time_start );

    for ( var i = 0; i < chargeEvents.length; i++ ) {
      var chargeEvent = chargeEvents[ i ];
      var time = moment( chargeEvent.time_start );

      // reached the end of period
      if ( time.isAfter( currentPeriod ) ) {
        // round the kwh to tenths
        collector.kwh = collector.kwh.toFixed( 1 );
        // save
        periods.push( { time: currentPeriod, events: totalEvents, kwh: kwh.toFixed( 1 ) } );
        // set new period
        currentPeriod = exports.setThirtyMinsInTheFuture( chargeEvent.time_start );
      }

      // always add
      collector.kwh += +chargeEvent.kwh;
      collector.totalEvents++;
    }

    return periods;
  });
};