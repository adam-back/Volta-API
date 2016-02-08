var db = require( '../../models/index.js' );
var csv = require( '../csvFactory.js' );
var time = require( './eventsOverTime.js' );
var Q = require( 'q' );
var moment = require( 'moment' );
moment().format();

exports.kwhGrowthOverTime = function() {
  // get all of the stations
  return db.station.findAll()
  .then(function( stations ) {
    var promises = [];
    // get their growth every day since May 15
    var numberOfStations = stations.length;
    for ( var i = 0; i < numberOfStations; i++ ) {
      var station = stations[ i ];
      promises.push( time.kwhByDay( station ) );
    }
    return Q.all( promises );
  })
  .then(function( growthData ) {
    // growth data is an array of JSON objects
    // see eventsOverTime.kwhByDay to see JSON format
    var fields = [ 'location', 'kin' ];
    var today = moment();
    var dateLabel = moment( '2015-05-16' );

    // generate date labels for every day since 5/16/2015
    // this could be a problem due to the db being UTC and the computer running of local time
    while ( dateLabel.isBefore( today ) ) {
      fields.push( dateLabel.format( 'M/D/YYYY' ) );
      dateLabel.add( 1, 'days' );
    }

    // generate CSV                              | field name is same as fields
    return csv.generateCSV( growthData, fields, fields );
  });
};