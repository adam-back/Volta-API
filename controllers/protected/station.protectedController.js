var request = require( 'request' );
var station = require( '../../models').station;
var express = require( 'express' );
var async     = require( 'async' );

module.exports = exports = {
  getAllStations: function ( req, res ) {
    // query database for all rows of stations
    station.findAll()
      .then(function( stations ) {
        // respond json with all data
        res.json( stations );
      })
      .catch(function( error ) {
        res.status( 500 ).send( error );
      });
  },
  getOneStation: function( req, res ) {
    console.log( 'here'  );
    // query database for all rows of stations
    station.findOne( { where: { kin: req.body.kin } } )
      .then(function( oneStation ) {
        // if found
        if( oneStation.length === 0 ) {
          res.status( 404 ).send( '<p>A station with that KIN was not found.</p>' );
        } else {
          res.json( oneStation );
        }
      })
      .catch(function( error ) {
        res.status( 500 ).send( error );
      });
  },
  addStation: function( req, res ) {
    // Validate that a station with same KIN doesn't exist, create it
    station.findOrCreate( { where: { kin: req.body.kin }, defaults: req.body } )
      .spread(function( station, created ) {
        // send boolean
        res.json( { successfullyAddedStation: created } );
      });
  },
  editStation: function( req, res ) {
    // object looks like:
    // { kin: #, changes: [ [ field, old, new ], [ field, old, new ] ] }
    station.find( { where: { kin: req.body.kin } } )
      .then(function( stationToUpdate ) {
        for ( var i = 0; i < req.body.changes.length; i++ ) {
          var field = req.body.changes[ i ][ 0 ];
          var newData = req.body.changes[ i ][ 2 ];
          stationToUpdate[ field ] = newData;
        }

        stationToUpdate.save()
          .then(function( successStation ) {
            res.json( successStation );
          })
          .catch(function( error ) {
            var query = {};
            // get the title that of the colum that errored
            var errorColumn = Object.keys( error.fields );
            // get the value that errored
            var duplicateValue = error.fields[ errorColumn ];
            query[ errorColumn ] = duplicateValue;

            // where conflicting key, value
            station.find( { where: query } )
              .then(function( duplicateStation ) {
                error.duplicateStation = duplicateStation;
                // 409 = conflict
                res.status( 409 ).send( error );
              })
              .catch(function( error ) {
                res.status( 500 ).send( error );
              });
          });
      })
      .catch(function( error ) {
        res.status( 404 ).send( error );
      });
  },
  deleteStation: function( req, res ) {
    // also deletes associated plugs
    station.find( { where: { kin: req.url.substring(1) } } )
    .then(function( station ) {
      // if there is a station with that kin
      if ( station ) {
        // get its plugs
        return station.getPlugs()
        .then(function( plugs ) {
          if( plugs ) {
            // destroy each plug
            return async.each( plugs, function( plug, cb ) {
              plug.destroy()
              .then(function( removedPlug ) {
                cb( null );
              })
              .catch(function( error ) {
                cb( error );
              });
            }, function( error ) {
              // if error destroying plug
              if( error ) {
                throw error;
              } else {
                return void( 0 );
              }
            });
          }
        })
        .then(function() {
          station.destroy()
          .then(function() {
            res.status( 204 ).send();
          });
        });
      // a station with that kin could not be found
      } else {
        res.status( 404 ).send( 'Station with that KIN not found in database. Could not be deleted.' );
      }
    })
    .catch(function( error ) {
      res.status( 500 ).send( 'Error deleting station: ' + error );
    });
  }
};