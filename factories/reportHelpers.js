var moment = require( 'moment' );

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