var request = require( 'request' );
var station = require( '../../models').station;
var app_sponsor = require( '../../models' ).app_sponsor;
var express = require( 'express' );
var async     = require( 'async' );
var appSponsorFactory = require( '../../factories/appSponsorFactory' );
var mediaSchedule = require( './mediaSchedule.protectedController.js' );
var q = require( 'q' );

module.exports = exports = {
  countStations: function ( req, res ) {
    station.count()
    .then(function( number ) {
      res.json( number );
    })
    .catch(function( error ) {
      res.status( 500 ).send( error );
    });
  },
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
    // query database for all rows of stations
    station.findOne( { where: { kin: req.url.substring(1) } } )
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
  //Kill switch - DO NOT CHANGE!
  setStationStatus: function (req, res) {
    if ( !io ) {
      var io = require( '../../server' ).io;
    }

    io.sockets.emit( req.params.kin, { status: req.body } );
    station.update( req.body, { where: { kin: req.params.kin } } );
  },
  addStation: function( req, res ) {
    var successfullyAddedStation = false;
    var id;
    // Validate that a station with same KIN doesn't exist, create it
    station.findOrCreate( { where: { kin: req.body.kin }, defaults: req.body } )
    .spread(function( foundStation, created ) {
      successfullyAddedStation = created;

      // if the station is newly created
      if ( created ) {
        id = foundStation.id;
        // associate if needed
        return appSponsorFactory.associateStationWithAppSponsors( foundStation )
        .then(function() {
          res.json( { successfullyAddedStation: true } );
        });
      } else {
        res.json( { successfullyAddedStation: false } );
      }
    })
    .catch(function( error ) {
      if ( successfullyAddedStation ) {
        // while this is async,
        // don't quite care
        station.destroy( { where: { id: id }, force: true } );
      }

      res.status( 500 ).send( error );
    });
  },
  editStation: function( req, res ) {
    // object looks like:
    // { kin: #, changes: [ [ field, old, new ], [ field, old, new ] ] }
    station.find( { where: { kin: req.body.kin } } )
    .then(function( stationToUpdate ) {
      var needToUpdateMediaSchedule = false;

      for ( var i = 0; i < req.body.changes.length; i++ ) {
        var field = req.body.changes[ i ][ 0 ];
        var newData = req.body.changes[ i ][ 2 ];

        if( field === 'front_display_pc_serial_number' ) {
          needToUpdateMediaSchedule = true;
        }

        stationToUpdate[ field ] = newData;
      }

      return stationToUpdate.save()
      .then(function( successStation ) {
        // default to volta filler media
        var oldMediaSchedule = {};
        // new
        if( needToUpdateMediaSchedule ) {
          return mediaSchedule.getMediaScheduleByKinLocal( req.body.kin )
          .then( function( schedules ) {
            if( schedules.length === 0 ) {
              return;
            } else {
              var oldMediaSchedule = schedules[ 0 ];

              var newMediaSchedule = JSON.parse( JSON.stringify( oldMediaSchedule ) );
              delete newMediaSchedule.deleted_at;
              delete newMediaSchedule.id;

              // update front_display_pc_serial_number
              newMediaSchedule.serial_number = stationToUpdate.front_display_pc_serial_number;

              return mediaSchedule.replaceMediaScheduleLocal( newMediaSchedule );
            }
          })
          .then( function() {
            return successStation;
          })
          .catch( function( error ) {
            throw new Error( 'Failed to replace media schedule on station pc serial number change:', error );
          });
        } else {
          return successStation;
        }
      });
    })
    .then(function( finalResult ) {
      res.json( finalResult );
    })
    .catch(function( error ) {
      // this part is confusing
      // need to trigger error to in order to mock error
      if ( error.hasOwnProperty( 'fields' ) && error.hasOwnProperty( 'fields' ).length > 0 ) {
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
      } else {
        res.status( 500 ).send( error );
      }
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
            async.each( plugs, function( plug, cb ) {
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
                throw new Error( error );
              } else {
                return void( 0 );
              }
            });
            return;
          }
        })
        .then(function() {
          return appSponsorFactory.removeAssociationBetweenStationAndAppSponsors( station );
        });
      // a station with that kin could not be found
      } else {
        res.status( 404 ).send( 'Station with that KIN not found in database. Could not be deleted.' );
      }
    })
    .then(function( station ) {
      return station.destroy();
    })
    .then(function() {
      res.status( 204 ).send();
    })
    .catch(function( error ) {
      res.status( 500 ).send( 'Error deleting station: ' + error );
    });
  }
};