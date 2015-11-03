var async = require( 'async' );
var Q = require( 'q' );
var app_sponsor = require( '../models' ).app_sponsor;
var station = require( '../models' ).station;

exports.associateStationWithAppSponsors = function( stationToAssociate ) {
  var deferred = Q.defer();

  app_sponsor.findAll()
  .then(function( sponsors ) {
    async.each(sponsors, function( sponsor, cb ) {
      if ( sponsor.station_query ) {
        var query = sponsor.station_query;
        // see if that individual station matches the query for sponsorship
        query.where.id = stationToAssociate.id;

        station.count( query )
        .then(function( number ) {
          // if it matches
          if ( number === 1 ) {
            // associate
            return sponsor.addStation( stationToAssociate );
          }
        })
        .then(function() {
          // successfully associated or done
          cb( null );
        })
        .catch(function( error ) {
          cb( error );
        });
      } else {
        cb( null );
      }
    }, function( error ) {
      if ( error ) {
        throw error;
      } else {
        deferred.resolve();
      }
    });
  })
  .catch(function( error ) {
    deferred.reject( error );
  });

  return deferred.promise;
};