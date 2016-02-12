var async = require( 'async' );
var Q = require( 'q' );
var app_sponsor = require( '../models' ).app_sponsor;
var station = require( '../models' ).station;

exports.associateStationWithAppSponsors = function( stationToAssociate ) {
  var deferred = Q.defer();

  app_sponsor.findAll()
  .then(function( sponsors ) {
    if ( sponsors.length > 0 ) {
      async.each(sponsors, function( sponsor, cb ) {
        // if the sponsor has a query
        if ( sponsor.station_query ) {
          var query = sponsor.station_query;
          // do a safety check. Make sure we're supposed to associate
          query.where.id = stationToAssociate.id;

          station.count( query )
          .then(function( number ) {
            // if it matches
            if ( number === 1 ) {
              // associate
              return sponsor.addStation( stationToAssociate );
            } else {
              return Q.when( null );
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
          throw new Error( error );
        } else {
          deferred.resolve();
        }
      });
    } else {
      throw new Error( 'No sponsors found.' );
    }
  })
  .catch(function( error ) {
    deferred.reject( error );
  });

  return deferred.promise;
};

exports.removeAssociationBetweenStationAndAppSponsors = function( stationToRemove ) {
  var deferred = Q.defer();

  stationToRemove.getAppSponsors()
  .then(function( appSponsors ) {
    async.each(appSponsors, function( appSponsor, cb ) {
      appSponsor.removeStation( stationToRemove )
      .then(function( success ) {
        cb( null );
      })
      .catch(function( error ) {
        cb( error );
      });
    }, function( error ) {
      if ( error ) {
        throw new Error( error );
      } else {
        deferred.resolve( stationToRemove );
      }
    });
  })
  .catch(function( error ) {
    deferred.reject( error );
  });

  return deferred.promise;
}