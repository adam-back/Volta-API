var moment = require( 'moment' );
moment().format();
var Q = require( 'q' );
var station = require( '../models').station;
var plug = require( '../models').plug;
var charge_event = require( '../models').charge_event;
var async     = require( 'async' );
var ekm = require( './ekmFactory.js' );

exports.orderByKin = function( collection ) {
  collection.sort(function( a, b ) {
    if ( a.kin.toLowerCase() < b.kin.toLowerCase() ) {
      return -1;
    } else {
      return 1;
    }
  });

  return collection;
};

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
  data.firstChargeEvent = moment( chargeEvents[ 0 ].time_start ).format( 'MMM D, YYYY' );

  ////////////
  // COUNT //
  var currentDay = moment( chargeEvents[ 0 ].time_start );
  // number of days
  var numberOfDays = 1;
  var chargeEventsForTheDay = 1;
  // number of charge events for each day
  var chargeEventsByDay = [];
  // total duration of usage
  var totalChargeDuration = 0;
  // durations for each charge event
  var chargeDurations = [];
  // total kwh of all charge events
  var totalKwh = 0;
  // kwh for each charge event
  var chargeKwh = [];

  // setup with first one
  var lengthOfCharge = exports.calculateChargeEventDuration( chargeEvents[ 0 ] );
  totalChargeDuration += lengthOfCharge;
  totalKwh += chargeEvents[ 0 ].kwh;

  chargeDurations.push( lengthOfCharge );
  chargeKwh.push( chargeEvents[ 0 ].kwh );

  for ( var i = 1; i < chargeEvents.length; i++ ) {
    var eventTime = moment( chargeEvents[ i ].time_start );
    lengthOfCharge = exports.calculateChargeEventDuration( chargeEvents[ i ] );
    totalChargeDuration += lengthOfCharge;
    totalKwh += chargeEvents[ i ].kwh;
    chargeDurations.push( lengthOfCharge );
    chargeKwh.push( chargeEvents[ i ].kwh );

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
  data.cumulativeKwh = Number( totalkWh.toFixed( 1 ) );

  // average number of events per day
  data.averageChargeEventsPerDay = Math.round( data.totalChargeEvents / data.totalChargeEventDays );
  // median number of events per day
  data.medianChargeEventsPerDay = exports.findMedian( chargeEventsByDay );
  // average duration of charge event
  data.averageDurationOfEvent = Math.round( totalChargeDuration / chargeDurations.length );
  // median duration of charge event
  data.medianDurationOfEvent = exports.findMedian( chargeDurations );
  // average kWh of charge event
  data.averageKwhOfEvent = Math.round( totalKwh / chargeKwh.length );
  // median kWh of charge event
  data.medianKwhOfEvent = exports.findMedian( chargeKwh );

  return data;
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

exports.chargeEventsOverTime = function( where, timePeriod ) {
  var timeNum = timePeriod[ 0 ];
  var timeUnit = timePeriod[ 1 ];
  var query = where || { where: {}, order: 'id', raw: true };
  query.order = 'id';
  query.raw = true;
  query.where.time_stop = { $ne: null };

  var collector = {
    totalEvents: 0,
    kwh: 0
  };
  var periods = [];

  return charge_event.findAll( query )
  .then(function( chargeEvents ) {
    // set the first 30-min period
    var currentPeriod = moment( chargeEvents[ 0 ].time_start ).add( timeNum, timeUnit );

    for ( var i = 0; i < chargeEvents.length; i++ ) {
      var chargeEvent = chargeEvents[ i ];
      var time = moment( chargeEvent.time_start );

      // reached the end of period
      if ( time.isAfter( currentPeriod ) ) {
        // round the kwh to tenths
        // toFixed returns string
        collector.kwh = Number( collector.kwh.toFixed( 1 ) );
        // save

        periods.push( { time: currentPeriod, events: collector.totalEvents, kwh: collector.kwh } );

        // set new period
        currentPeriod = moment( currentPeriod.add( timeNum, timeUnit ) );
      }

      // always add
      collector.kwh += +chargeEvent.kwh;
      collector.totalEvents++;
    }

    // don't forget the last period
    currentPeriod = moment( currentPeriod.add( timeNum, timeUnit ) );
    periods.push( { time: currentPeriod, events: collector.totalEvents, kwh: collector.kwh.toFixed( 1 ) } );
    return periods;
  });
};

exports.chargesOverLastThirtyDaysForOneStation = function( oneStation ) {
  var thirtyDaysAgo = moment().startOf( 'day' ).subtract( 1, 'day' ).subtract( 1, 'month' );
  var where = {
    where: {
      station_id: oneStation.id,
      time_start: {
        $gt: thirtyDaysAgo.toDate()
      },
      time_stop: {
        $ne: null
      }
    },
    raw: true,
    order: [ 'time_start', 'ASC' ]
  };

  return charge_event.findAll( where )
  .then(function( eventsForStation ) {
    var averagesAndMedians = exports.countChargesAndDuration( eventsForStation );
    var consumerNumbers = exports.convertKwhToConsumerEquivalents( averagesAndMedians.cumulativeKwh );
    var consumerNumbersAverage = exports.convertKwhToConsumerEquivalents( averagesAndMedians.averageKwhOfEvent );
    var consumerNumbersMedian = exports.convertKwhToConsumerEquivalents( averagesAndMedians.medianKwhOfEvent );

    var dataForCSV = {
      kin: oneStation.kin,
      location: oneStation.location,
      since: moment( eventsForStation[ 0 ].time_start ).format( 'MMM D, YYYY' ),
      // cumulative kWh
      kWh: averagesAndMedians.cumulativeKwh,
      carbon: consumerNumbers.offset,
      miles: consumerNumbers.miles,
      trees: consumerNumbers.trees,
      gallons: consumerNumbers.miles,
      // charge events
      numberOfCharges: averagesAndMedians.totalChargeEvents,
      averageChargeEventsPerDay: averagesAndMedians.averageChargeEventsPerDay,
      medianChargeEventsPerDay: averagesAndMedians.medianChargeEventsPerDay,
      averageDurationOfEvent: averagesAndMedians.averageDurationOfEvent,
      medianDurationOfEvent: averagesAndMedians.medianDurationOfEvent,
      // Average kwh per event
      averageKwhOfEvent: averagesAndMedians.averageKwhOfEvent,
      averageCarbonPerEvent: consumerNumbersAverage.offset,
      averageMilesPerEvent: consumerNumbersAverage.miles,
      averageTreesPerEvent: consumerNumbersAverage.trees,
      averageGallonsPerEvent: consumerNumbersAverage.miles,
      // Median kwh per event
      medianKwhOfEvent: averagesAndMedians.medianKwhOfEvent,
      medianCarbonPerEvent: consumerNumbersMedian.offset,
      medianMilesPerEvent: consumerNumbersMedian.miles,
      medianTreesPerEvent: consumerNumbersMedian.trees,
      medianGallonsPerEvent: consumerNumbersMedian.miles
    };
    return dataForCSV;
  });
};