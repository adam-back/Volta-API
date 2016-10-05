var models  = require( '../../models');
var csv     = require( '../csvFactory');
var helpers = require( '../reportHelpers' );
var moment  = require( 'moment' );
var Q       = require( 'q' );

var Row = function( stationWithPlug, startMonth ) {
  var firstMonth = moment.utc( startMonth, 'MMMM' ).format( 'MMMM' );
  var secondMonth = moment.utc( startMonth, 'MMMM' ).add( 1, 'months' ).format( 'MMMM' );
  var thirdMonth = moment.utc( startMonth, 'MMMM' ).add( 2, 'months' ).format( 'MMMM' );

  // station is eagerly loaded with plug
  this.Kin = station.kin;
  this.Location = station.location;
  this.Address = station.location_address;
  this[ 'Plug Number' ] = station[ 'plugs.number_on_station' ] || null;
  this.Omnimeter = station[ 'plugs.ekm_omnimeter_serial' ] || null;
  this.Months = [];
  this.kWh = [];
  this.Minutes = [];

  // Cumulative data
  this[ 'Quarter kWh Diff' ] = null;
    // kWh
  this[ 'Quarter Total Charge Events' ] = null;
  this[ 'Quarter Average Charge kWh' ] = null;
  this[ 'Quarter Median Charge kWh' ] = null;
    // duration
  this[ 'Quarter Total Minutes In Use' ] = null;
  this[ 'Quarter Average Charge Duration' ] = null;
  this[ 'Quarter Median Charge Duration' ] = null;

  // Green Data
  this.Miles = null;
  this[ 'Carbon Offset' ] = null;
  this.Gallons = null;
  this.Trees = null;
  this.Comment = null;

  this.initializeNewMonth( firstMonth );
  this.initializeNewMonth( secondMonth );
  this.initializeNewMonth( thirdMonth );

  if ( !station[ 'plugs.id' ] ) {
    row.comment = 'No Plug';
  }
};

Row.prototype.initializeNewMonth = function( month ) {
  this[ month + ' kWh Start' ] = null;
  this[ month + ' kWh End' ] = null;
  this[ month + ' kWh Diff' ] = null;
  this[ month + ' Total Charge Events' ] = null;
  this[ month + ' Total Minutes In Use' ] = null;
  this[ month + ' Average Charge kWh' ] = null;
  this[ month + ' Median Charge kWh' ] = null;
  this[ month + ' Average Charge Duration' ] = null;
  this[ month + ' Median Charge Duration' ] = null;
  this.Months.push( month );
};

Row.prototype.addMonthValues = function( readingSummary, chargeSummary ) {
  // strip ' 2016' from 'September 2016'
  var month = readingSummary.month.replace( /\s[0-9]{4}/, '' );

  // this[ September kWh Start ] = 123
  this[ month + ' kWh Start' ] = readingSummary.kwh_start;
  this[ month + ' kWh End' ] = readingSummary.kwh_end;
  this[ month + ' kWh Diff' ] = readingSummary.kwh_diff;
  this[ month + ' Total Charge Events' ] = chargeSummary.number_of_events;
  this[ month + ' Total Minutes In Use' ] = chargeSummary.total_minutes;

  var kwh = helpers.convertDecimalsToNumbers( chargeSummary.kwh_for_events );
  this[ month + ' Average Charge kWh' ] = helpers.findAverage( kwh );
  this[ month + ' Median Charge kWh' ] = helpers.findMedian( kwh );
  // for quarter minutes avg/med.
  this.kWh.concat( kwh );

  var minutes = reportHelpers.convertDecimalsToNumbers( chargeSummary.minutes_for_events );
  this[ month + ' Average Charge Duration' ] = helpers.findAverage( minutes );
  this[ month + ' Median Charge Duration' ] = helpers.findMedian( minutes );
  // for quarter minutes avg/med.
  this.Minutes.concat( minutes );
};

Row.prototype.roundAndEmpty = function() {
  // go through properties
  for ( var key in this ) {
    // make sure we're not dealing with a prototype
    if ( this.hasOwnProperty( key ) ) {
      var value = this[ key ];

      // if number, round to nearest 10th
      if ( typeof value === 'number' ) {
        this[ key ] = Number( value.toFixed( 1 ) );
      // if null or undefined, make empty string
      } else if ( value === null || value === undefined ) {
        this[ key ] = '';
      } // else it's a string which shouldn't be changed
    }
  }
};

Row.prototype.calculateEntireQuarter = function() {
  var firstMonth = this.Months[ 0 ];
  var secondMonth = this.Months[ 1 ];
  var thirdMonth = this.Months[ 2 ];

  // Quarter kWh
  // null + null + null = 0
  var kWh = this[ firstMonth + 'kWh Diff' ] + this[ secondMonth + 'kWh Diff' ] + this[ thirdMonth + 'kWh Diff' ];
  this[ 'Quarter kWh Diff' ] = kWh;

  // Green data
  var green = helpers.convertKwhToConsumerEquivalents( this[ 'Quarter kWh Diff' ] );
  this.Miles = green.miles;
  this[ 'Carbon Offset' ] = green.offset;
  this.Gallons = green.gallons;
  this.Trees = green.trees;

  // Charge Event Data
  this[ 'Quarter Total Charge Events' ] = this[ firstMonth + ' Total Charge Events' ] + this[ secondMonth + ' Total Charge Events' ] + this[ thirdMonth + ' Total Charge Events' ];
  if ( this.kWh.length > 0 ) {
    this[ 'Quarter Average Charge kWh' ] = helpers.findAverage( this.kWh );
    this[ 'Quarter Median Charge kWh' ] = helpers.findMedian( this.kWh );
  }
  delete this.kWh;

  this[ 'Quarter Total Minutes In Use' ] = this[ firstMonth + 'Total Minutes In Use' ] + this[ secondMonth + 'Total Minutes In Use' ] + this[ thirdMonth + 'Total Minutes In Use' ];
  if ( this.Minutes.length > 0 ) {
    this[ 'Quarter Average Charge Duration' ] = helpers.findAverage( this.Minutes );
    this[ 'Quarter Median Charge Duration' ] = helpers.findMedian( this.Minutes );
  }
  delete this.Minutes;
  delete this.Months;
};

// expose
exports.Row = Row;

exports.getStartMonth = function( quarter ) {
  quater = quarter.toString();
  var startMonth = '';

  if ( quarter === '1' ) {
    startMonth = 'January';
  } else if ( quarter === '2' ) {
    startMonth = 'April';
  } else if ( quarter === '3' ) {
    startMonth = 'July';
  } else if ( quarter === '4' ) {
    startMonth = 'October';
  } else {
    throw new Error( 'Wrong quarter provided: ' + quarter + '. Only 1-4 accepted.' );
  }

  return startMonth;
};

exports.getSummariesForMonthFromPlug = function( plugId, month, year ) {
  var monthLookup = month + '' + year; // September 2016
  var summaries = [];
  summaries.push( models.ekm_reading_month_summary.findOne( { where: { plug_id: plugId, month: monthLookup }, raw: true } ) );
  summaries.push( models.charge_event_month_summary.findOne( { where: { plug_id: plugId, month: monthLookup }, raw: true } ) );
  return Q.all( summaries );
};

exports.getAndAddOneMonth = function( row, plugId, month, year ) {
  return exports.getSummariesForMonthFromPlug( plugId, month, year )
  .spread(function( readingMonth, chargeMonth ) {
    if ( readingMonth && chargeMonth ) {
      row.addMonthValues( readingMonth, chargeMonth );
    }

    return row;
  });
};

exports.createRowForOneStation = function( stationAndPlug, startMonth, year ) {
  var deferred = Q.defer();

  var plugId = stationAndPlug[ 'plugs.id' ];
  var row = new exports.Row( stationAndPlug, startMonth );
  if ( row.Comment === 'No Plug' ) {
    row.roundAndEmpty();
    deferred.resolve( row );
  }

  exports.getAndAddOneMonth( row, plugId, row.Months[ 0 ], year )
  .then(function( rowWithOneMonth ) {
    return exports.getAndAddOneMonth( row, plugId, row.Months[ 1 ], year );
  })
  .then(function( rowWithTwoMonths ) {
    return exports.getAndAddOneMonth( row, plugId, row.Months[ 2 ], year );
  })
  .then(function( rowWithThreeMonths ) {
    rowWithThreeMonths.roundAndEmpty();
    deferred.resolve( rowWithThreeMonths );
  })
  .catch(function( error ) {
    deferred.reject( error );
  });

  return deferred.promise;
};

exports.generateQuarterlyReport = function( quarter, year ) {
  // figure out which months we need to query for
  var startMonth = exports.getStartMonth( quarter );

  return models.station.findAll( { include: [ models.plug ], raw: true } )
  .then(function( stationsWithPlug ) {
    var quarterlyData = [];

    for ( var numStationsWithPlug = stationsWithPlug.length, i = 0; i < numStationsWithPlug; i++ ) {
      var stationAndPlug = stationsWithPlug[ i ];
      quarterlyData.push( exports.createRowForOneStation( stationAndPlug, startMonth, year ) );
    }

    return Q.all( quarterlyData );
  })
  .then(function( rows ) {
    return csv.generateCSV( rows );
  });
  // output CSV
};
