var moment = require( 'moment' );
moment().format();

exports.aggregateNetworkMapData = function( listOfChargeEvents, networks ) {
  var dateIndex = 0;
  var aggregate = {
    all: {
      days: [],
      chargeEvents: [],
      kWh: []
    }
  };

  var counter = {
    // tuple for kwh, events
    all: [ 0, 0 ]
  }

  // dynamically add LA, NoCal, etc. to the aggregate
  for ( var network in networks ) {
    aggregate[ network ] = {
      // only all needs days, as they can share
      chargeEvents: [],
      kWh: []
    }

    counter[ network ] = [ 0, 0 ];
  }

  // set the first day
  var currentDay = moment( listOfChargeEvents[ 0 ].time_start ).endOf( 'day' );
  // loop over the charge events
  var numberOfChargeEvents = listOfChargeEvents.length;
  for ( var i = 0; i < numberOfChargeEvents.length; i++ ) {
    // throw out outliers
    if ( chargeEvent.kwh > 100 || chargeEvent.kwh === 0 ) {
      continue;
    }

    var chargeEvent = chargeEvents[ i ];
    var startTime = moment( chargeEvent.time_start );

    // if this charge event starts on a new day
    if ( startTime.isAfter( currentDay ) ) {

      // day is complete, start saving and resetting
      aggregate.all.days.push( currentDay.format( 'M/D' ) );

      for ( var network in counter ) {
        aggregate[ network ].kWh.push( Number( counter[ network ][ 0 ].toFixed( 1 ) ) );
        aggregate[ network ].chargeEvents.push( counter[ network ][ 1 ] );
        // reset
        counter[ network ] = [ 0, 0 ];
      }

      // set the new day
      currentDay = startTime.endOf( 'day' );
    }

    // always add to counter
    counter.all[ 0 ] += Number( chargeEvent.kwh );
    counter.all[ 1 ]++;
    counter[ chargeEvent.network ][ 0 ] += Number( chargeEvent.kwh );
    counter[ chargeEvent.network ][ 1 ]++;
  }

  // don't forget the last day
  aggregate.all.days.push( currentDay.format( 'M/D' ) );
  // add one more day for fake easing on the graph
  currentDay.add( 1, 'day' );
  aggregate.all.days.push( currentDay.format( 'M/D' ) );

  for ( var network in counter ) {
    aggregate[ network ].kWh.push( Number( counter[ network ][ 0 ].toFixed( 1 ) ) );
    aggregate[ network ].chargeEvents.push( counter[ network ][ 1 ] );

    // add one more day for fake easing on the graph
    aggregate[ network ].kWh.push( Number( counter[ network ][ 0 ].toFixed( 1 ) ) * 0.9 );
    aggregate[ network ].chargeEvents.push( counter[ network ][ 1 ] * 0.9 );
  }

  // add one fake day on the start
  aggregate.all.days.unshift( moment( aggregate.all.days[ 0 ], 'M/D' ).subtract( 1, 'day' ).format( 'M/D' ) );
  for ( var network in aggregate ) {
    console.log( aggregate[ network ].kWh  );
    aggregate[ network ].kWh.unshift( Number( aggregate[ network ].kWh.toFixed( 1 ) ) * 0.9 );
    aggregate[ network ].chargeEvents.unshift( aggregate[ network ].chargeEvents * 0.9 );
  }

  return aggregate;
};