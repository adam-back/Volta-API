var charge_event = require( '../../models' ).charge_event;
var station = require( '../../models' ).station;
var moment = require( 'moment' );
moment().format();

exports.countNumberOfDaysWithoutData = function( firstDayWithCharge, nextDayWithCharge, kwh ) {
  var nulls = {};

  // first two parameters are moment objects at the end of their day
  var howManyDaysLater = nextDayWithCharge.diff( firstDayWithCharge, 'days' );
  var firstDay = firstDayWithCharge;

  // charge event on May 1
  // next charge event on May 5
  // 4 days later
  for ( var i = 1; i < howManyDaysLater; i++ ) {
    // create key like 5/2/2016 for May 2, 2016
    var dateKey = firstDay.add( 1, 'days' ).format( 'M/D/YYYY' );
    nulls[ dateKey ] = kwh;
  }

  return nulls;
};

exports.mergeObjects = function( masterObj, objToAdd ) {
  for ( var key in objToAdd ) {
    masterObj[ key ] = objToAdd[ key ];
  }

  return masterObj;
};

exports.kwhByDay = function( station ) {
  // SELECT *
  // FROM charge_events
  // WHERE station_id={ station.id } AND kwh<100 AND time_stop IS NOT NULL
  // ORDER BY time_start;
  var query = { where: { station_id: station.id, kwh: { $lt: 100 }, time_stop: { $ne: null } }, order: 'time_start', raw: true };
  var cumulativekWh = 0;
  var timeline = { location: station.location, kin: station.kin };

  // count the number of charge events
  // we don't want to do the expensive query if there's nothing to look for
  return charge_event.count( { where: { station_id: station.id } } )
  .then(function( numberOfCharges ) {
    if ( numberOfCharges > 0 ) {
      // find all of the charge events which are closed for a station, ordered by time_start
      return charge_event.findAll( query )
      .then(function( chargeEvents ) {
        // set the first day
        var currentDay = moment( chargeEvents[ 0 ].time_start ).endOf( 'day' );

        // add nulls for days we don't have data from May 16
        var nullDates = exports.countNumberOfDaysWithoutData( moment( '2015 05 15', 'YYYY MM DD' ).endOf( 'day' ), currentDay, null );
        timeline = exports.mergeObjects( timeline, nullDates );

        // loop over the charge events
        for ( var i = 0; i < chargeEvents.length; i++ ) {
          var chargeEvent = chargeEvents[ i ];
          var startTime = moment( chargeEvent.time_start );

          // if this charge event starts on a new day
          if ( startTime.isAfter( currentDay ) ) {
            // round kwh
            cumulativekWh = Number( cumulativekWh.toFixed( 1 ) );
            // add to timeline
            timeline[ currentDay.format( 'M/D/YYYY' ) ] = cumulativekWh;

            // account for days we have no charge events
            var nextDayWithCharges = startTime.endOf( 'day' );
            var daysMissing = exports.countNumberOfDaysWithoutData( currentDay, nextDayWithCharges, cumulativekWh );
            timeline = exports.mergeObjects( timeline, daysMissing );

            // set the new day
            currentDay = nextDayWithCharges;
          }

          // always add to cumulative
          cumulativekWh += Number( chargeEvent.kwh );
        }

        // don't forget the last day
        cumulativekWh = Number( cumulativekWh.toFixed( 1 ) );
        timeline[ currentDay.format( 'M/D/YYYY' ) ] = cumulativekWh;

        // add flatline until we get to today
        var daysUntilToday = exports.countNumberOfDaysWithoutData( currentDay, moment().add( 2, 'days'), cumulativekWh );
        timeline = exports.mergeObjects( timeline, daysUntilToday );
        return timeline;
      });
    } else {
      return null;
    }
  });
};

exports.dataOverThirtyDays = function() {
  var current = moment();
  var thirtyDaysAgo = moment().subtract( 30, 'days' );
  var id = null;
  var totalData = {};
  var elseifcounter = 0;

  return station.findAll( { raw: true })
  .then(function( stations ) {

    var numberOfStations = stations.length;
    // create hash of station info
    for (var i = 0; i < numberOfStations; i ++) {
      var id = stations[ i ].id;

      totalData[ id ] = {
        id: stations[ i ].id,
        kin: stations[ i ].kin,
        network: stations[ i ].network,
        location: stations[ i ].location,
        kwh: 0,
        events: 0,
        time_spent_charging: 0,
        median_charge_events_per_day: 0,
        median_session_length: 0,
        charge_event_counter: 0,
        current_session_day: null,
        session_lengths: [],
        charge_events: []
      };
    }

    // get all closed charge events from the last 30 days
    return charge_event.findAll( { where: { time_start: { $gt: thirtyDaysAgo.toDate() } , time_stop: { $ne: null } }, order: 'time_start', raw: true } );
  })
  .then(function ( chargeEvents ) {

    var numberOfChargeEvents = chargeEvents.length;
    var allMedianChargeEvents = [];
    var allMedianSessionLengths = [];
    var medianChargeEvents = 0;
    var medianSessionLengths = 0;
    var networkMedians = {
      'Hawaii' : {
        chargeEvents: null,
        sessionLengths: null,
        chargeEventCollection: [],
        sessionLengthCollection: []
      },
      'SD' : {
        chargeEvents: null,
        sessionLengths: null,
        chargeEventCollection: [],
        sessionLengthCollection: []
      },
      'LA' : {
        chargeEvents: null,
        sessionLengths: null,
        chargeEventCollection: [],
        sessionLengthCollection: []
      },
      'NoCal' : {
        chargeEvents: null,
        sessionLengths: null,
        chargeEventCollection: [],
        sessionLengthCollection: []
      },
      'Chicago' : {
        chargeEvents: null,
        sessionLengths: null,
        chargeEventCollection: [],
        sessionLengthCollection: []
      },
      'Arizona' : {
        chargeEvents: null,
        sessionLengths: null,
        chargeEventCollection: [],
        sessionLengthCollection: []
      }
    }

    var isEven = function (num) {
      return num % 2 === 0;
    }

    var getMedianFromArray = function (arr) {
      var length = arr.length;
      var median;
      var leftIndex = Math.floor(length / 2);
      var rightIndex = Math.ceil(length / 2);

      if (isEven(length)) {
        median = (arr[leftIndex] + arr[rightIndex]) / 2;
      } else {
        median = arr[leftIndex];
      }

      return median;
    }

    for (var j = 0; j < numberOfChargeEvents; j ++) {
      var stationId = chargeEvents[ j ].station_id;
      // if we have a record of that station
      if ( totalData[ stationId ] ) {
        // add to the accumulator
        totalData[ stationId ].kwh += chargeEvents[ j ].kwh;
        totalData[ stationId ].events++;
        var start = moment( chargeEvents[ j ].time_start );
        var stop = moment( chargeEvents[ j ].time_stop );
        totalData[ stationId ].time_spent_charging += stop.diff( start, 'minutes' );

        var medianSessions = Math.round((chargeEvents[j].time_stop - chargeEvents[j].time_start) / 1000 / 60);
        totalData[ stationId ].session_lengths.push(medianSessions);

        if ( !totalData[stationId].current_session_day ) {
          totalData[stationId].current_session_day = chargeEvents[ j ].created_at;
          totalData[stationId].charge_event_counter++;
        } else if ( !moment(totalData[stationId].current_session_day).isSame(chargeEvents[ j ].created_at, 'day') ) {
          totalData[stationId].charge_events.push(totalData[stationId].charge_event_counter);
          totalData[stationId].charge_event_counter = 1;
          totalData[stationId].current_session_day = chargeEvents[ j ].created_at;
        } else {
          totalData[stationId].charge_event_counter++;
        }
      }
    }

    // get rid of bubbles we have no data for
    for ( var id in totalData ) {
      if ( totalData[ id ].events === 0 || totalData[ id ].kwh === 0 || totalData[ id ].time_spent_charging === 0 ) {
        delete totalData[ id ];
      }
    }


    for (var key in totalData) {
        // Pushes extra 0s into the array in case there are charge events missing, this gives an accurate median

      if (totalData[key].charge_events.length < 30) {
        var difference = 30 - totalData[key].charge_events.length;
        var sessionsArrayLength = totalData[key].session_lengths.length;

        // console.log("SESSIONS ARRAY LENGTH", sessionsArrayLength)

        for (var i = 0; i < difference; i ++) {
          totalData[key].charge_events.push(0);
        }
       };

       totalData[key].session_lengths.sort(function (a, b) {
         return a - b;
       })

       totalData[key].charge_events.sort(function (a, b) {
         return a - b;
       })
       //Find the median values for sessions, take the average of the 2 middle values if even, otherwise take the middle value
       if (isEven(sessionsArrayLength)) {
        // console.log('inside true block');
        var leftIndex = Math.floor(totalData[key].session_lengths.length / 2);
        var rightIndex = Math.ceil(totalData[key].session_lengths.length / 2);
        totalData[key].median_session_length = (totalData[key].session_lengths[leftIndex] + totalData[key].session_lengths[rightIndex]) / 2;
       } else {
        // console.log('inside false block');
        var rightIndex = Math.ceil(totalData[key].session_lengths.length / 2);
        totalData[key].median_session_length = totalData[key].session_lengths[rightIndex];
       }

       //Find the median value for charge_events
       totalData[key].median_charge_events_per_day = getMedianFromArray(totalData[key].charge_events);
    }

    //Loop through entire totalData collection and group up the global median data and the data by network
    for (var key in totalData) {
      allMedianChargeEvents.push(totalData[key].median_charge_events_per_day);
      allMedianSessionLengths.push(totalData[key].median_session_length);
      //Special condition for stations grouped under 'LA' but labeled as 'OC' and 'SB'
      if (totalData[key].network === 'OC' || totalData[key].network === 'SB') {
        networkMedians['LA'].chargeEventCollection.push(totalData[key].median_charge_events_per_day);
        networkMedians['LA'].sessionLengthCollection.push(totalData[key].median_session_length);
      };
      //Puts median data into collections grouped by network
      if (networkMedians[totalData[key].network]) {

        var currentNetwork = networkMedians[totalData[key].network];

        currentNetwork.chargeEventCollection.push(totalData[key].median_charge_events_per_day);
        currentNetwork.sessionLengthCollection.push(totalData[key].median_session_length);
      };
    }

    //Sort all of the median values per network so we can grab the total median
    for (var key in networkMedians) {
      networkMedians[key].chargeEventCollection.sort(function (a, b) {
        return a - b;
      })
      networkMedians[key].sessionLengthCollection.sort(function (a, b) {
        return a - b;
      })
      networkMedians[key].chargeEvents = getMedianFromArray(networkMedians[key].chargeEventCollection);
      networkMedians[key].sessionLengths = getMedianFromArray(networkMedians[key].sessionLengthCollection);
    }

    allMedianChargeEvents.sort(function (a, b) {
      return a - b;
    })

    allMedianSessionLengths.sort(function (a, b) {
      return a - b;
    })

    if (!isEven(allMedianChargeEvents)) {
      var middleIndex = Math.floor(allMedianChargeEvents.length / 2);
      medianChargeEvents = allMedianChargeEvents[ middleIndex ];
    } else {
      var leftIndex = Math.floor(allMedianChargeEvents.length / 2);
      var rightIndex = Math.ceil(allMedianChargeEvents.length / 2);
      medianChargeEvents = ((allMedianChargeEvents[leftIndex] + allMedianChargeEvents[rightIndex]) / 2 );
    }

    if (!isEven(allMedianSessionLengths)) {
      var middleIndex = Math.floor(allMedianSessionLengths.length / 2);
      medianSessions = allMedianSessionLengths[ middleIndex ];
    } else {
      var leftIndex = Math.floor(allMedianSessionLengths.length / 2);
      var rightIndex = Math.ceil(allMedianSessionLengths.length / 2);
      medianSessions = ((allMedianSessionLengths[leftIndex] + allMedianChargeEvents[rightIndex]) / 2 );
    }

    totalData.medianChargeEvents = medianChargeEvents;
    totalData.medianSessionLengths = medianSessions;
    totalData.networkMedians = networkMedians;

    return totalData;
  });
};
