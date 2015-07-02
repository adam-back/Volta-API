var station = require( '../../models').station;
var station_report = require( '../../models' ).station_report;
var express = require( 'express' );
var async     = require( 'async' );
var Q = require( 'q' );

var connectStationsWithPlugs = function( stations ) {
  var deferred = Q.defer();
  var stationsAndPlugs = [];

  // for each station
  async.each( stations, function( station, cb ) {
    // get only the values of the station
    var plainStation = station.get( { plain: true } );
    // get the associated plugs for the station
    station.getPlugs()
    .then(function( plugs ) {
      // if there are plugs, i.e. push and cloudgate installed
      if ( plugs && plugs.length > 0 ) {
        // create a plugs field on the station
        plainStation.plugs = [];
        // for each plug on the station
        for ( var i = 0; i < plugs.length; i++ ) {
          // push the values of plug to the plugs array on station
          plainStation.plugs[ plugs[ i ].number_on_station - 1 ] = plugs[ i ].get( { plain: true } );
        }
      // station not metered, no plugs
      } else {
        plainStation.plugs = null;
      }

      stationsAndPlugs.push( plainStation );
      cb( null );
    })
    .catch(function( error ) {
      cb( error );
    });
  }, function( error ) {
    if ( error ) {
      deferred.reject( error );
    } else {
      deferred.resolve( stationsAndPlugs );
    }
  });

  return deferred.promise;
};

var groupByKin = function( stationsWithPlugs ) {
}

module.exports = exports = {
  getStationsAndPlugs: function ( req, res ) {
    var stationsAndPlugs = [];
    var groupedByKin = {
      // kin: common kin,
      // location: coloquial location, eg. Serra Shopping Center,
      // address: common location_address
      // stations: array of stations
        // [{
            // id:
            // kin:
            // etc:
            // plugs: array of plugs
              // [{
                  // id:
                  // number_on_station:
                  // etc
              // }]
        // }]
    };

    // get all stations
    station.findAll()
    .then(function( stations ) {
      return connectStationsWithPlugs( stations );
    })
    .then(function( stationsAndPlugs ) {

    })
    .catch(function( error ) {
      res.status( 500 ).send( error );
    });
  },
  saveReport: function ( req, res ) {
    station_report.create( req.body )
    .then(function( success ) {
      res.status( 204 ).send(); // needs to be this for iOS app
    })
    .catch(function( error ) {
      res.status( 500 ).send( error );
    });
  }
};