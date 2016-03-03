var request = require( 'request' );
var mediaPresentation = require( '../../models').media_presentation;
var mediaSchedule = require( '../../models' ).media_schedule;
var station = require( '../../models').station;
var Q = require( 'q' );

/* HELPER METHODS */

// Used by Station Manager (through replaceMediaScheduleLocal)
var deleteMediaScheduleByKin = function( kin ) {
  return mediaSchedule.destroy({
    where: {
      kin: kin
    }
  });
};

// Used by Station Manager (through replaceMediaScheduleLocal)
var addMediaScheduleLocal = function ( schedule ) {
  // spreads to ( user, created )
  return mediaSchedule.findOrCreate( { where: { kin: schedule.kin }, defaults: schedule } );
};

// Used by Station Manager (through replaceMediaScheduleLocal)
var getMediaScheduleByKinLocal = function ( kin ) {
  return mediaSchedule.findAll( {
    where: {
      kin: kin
    }
  });
};

// Used by Station Manager
var replaceMediaScheduleLocal = function( newSchedule ) {
  // get presentation
  var presentation = newSchedule.schedule.presentation;
  delete newSchedule.schedule.presentation;

  // add presentation to schedule
  newSchedule.schedule.presentation = presentation.id;
  newSchedule.media_presentation_id = presentation.id;

  // Stringify so that the schedule can be saved to the database
  newSchedule.schedule = JSON.stringify( newSchedule.schedule );

  // find and delete existing media schedule
  return getMediaScheduleByKinLocal( newSchedule.kin )
  .then( function( schedule ) {
    if( schedule ) {
      return deleteMediaScheduleByKin( newSchedule.kin );
    } else {
      return Q();
    }
  })
  // add the new media schedule to replace the deleted one
  .then( function( deletedSchedule ) {
    return addMediaScheduleLocal( newSchedule );
  })
  // return the media schedule with its specified presentation
  .spread( function( addedSchedule, wasCreated ) {
    return mediaPresentation.findAll( { where: { id: presentation.id } } )
    .then( function( presentations ) {
      addedSchedule.dataValues.presentations = presentations;
      return addedSchedule.dataValues;
    })
  })
  .catch( function( error ) {
    console.log( '\n\n ERROR', error );
    throw new Error ( 'failed to replace media schedule', error );
  })
};

/* END HELPER METHODS */


module.exports = exports = {

  // Used by Station Manager
  getAllMediaSchedulesWithPresentations: function( req, res ) {
    mediaSchedule.findAll( { raw: true } )
    .then( function( schedules ) {
      return mediaPresentation.findAll( { raw: true } )
      .then( function( presentations ) {
        // convert presentations array to hash table where id is key
        var presentationsHash = {};
        for( var i = 0; i < presentations.length; i++ ) {
          var presentation = presentations[ i ];
          presentationsHash[ presentation.id ] = presentation;
        }

        for( var j = 0; j < schedules.length; j++ ) {
          var presentationID = schedules[ j ].media_presentation_id;
          // every schedule has one presentation (1-* relationship)
          schedules[ j ].presentations = [ presentationsHash[ presentationID ] ];
        }

        res.json( schedules );
      });
    })
    .catch( function( error ) {
      res.status( 500 ).send( error.message );
    });
  },

  // Will be used by Station Manager (Isn't currently...)
  deleteMediaSchedule: function( req, res ) {
    mediaSchedule.destroy( { where: { id: req.params.id } } )
    .then( function( numberDestroyed ) {
      if ( numberDestroyed !== 1 ) {
        throw new Error( 'Wrong number of media schedules destroyed: ' + numberDestroyed );
      } else {
        res.json( numberDestroyed );
      }
    })
    .catch( function( error ) {
      res.status( 500 ).send( error.message );
    });
  },

  // Used by Station Manager
  replaceMediaSchedule: function( req, res ) {
    var schedule = req.body;
    var kin = schedule.kin;

    replaceMediaScheduleLocal( schedule )
    .then( function( newSchedule ) {
      res.json( newSchedule );
    })
    .catch( function( error ) {
      console.log( 'failed to replaceMediaSchedule', error );
      res.status( 500 ).send( error );
    });
  },

  // Used my Station Manager
  addMediaSchedule: function ( req, res ) {
    // Validate that a station with same KIN doesn't exist, create it
    mediaSchedule.findOrCreate( { where: { kin: req.body.kin }, defaults: req.body } )
    .spread(function( schedule, created ) {
      if( created ) {
        schedule.setMediaPresentations([ schedule.dataValues.schedule.presentation ])
        res.json( { successfullyAddedMediaSchedule: created } );
      } else {
        throw new Error ( 'Schedule already exits for kin ' + req.body.kin );
      }
    })
    .catch( function( error ) {
      res.status( 500 ).send( error );
    });
  },

  // Will be used by Station Manager (Isn't currently...)
  setMediaScheduleSerialNumber: function( req, res ) {
    mediaSchedule.find( { where: { kin: req.body.kin } } )
    .then(function( mediaScheduleToUpdate ) {
      for ( var i = 0; i < req.body.changes.length; i++ ) {
        var field = req.body.changes[ i ][ 0 ];
        var newData = req.body.changes[ i ][ 2 ];
        mediaScheduleToUpdate[ field ] = newData;
      }

      mediaScheduleToUpdate.save()
      .then(function( successmediaSchedule ) {
        res.json( successmediaSchedule );
      })
      .catch(function( error ) {
        var query = {};
        // get the title that of the colum that errored
        var errorColumn = Object.keys( error.fields );
        // get the value that errored
        var duplicateValue = error.fields[ errorColumn ];
        query[ errorColumn ] = duplicateValue;

        // where conflicting key, value
        mediaSchedule.find( { where: query } )
        .then(function( duplicatemediaSchedule ) {
          error.duplicatemediaSchedule = duplicatemediaSchedule;
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

  // Used by Media Player
  getMediaScheduleBySerialNumber: function( req, res ) {
    var serialNumber = req.params.serialNumber;

    mediaSchedule.findAll( {
      where: {
        serial_number: serialNumber
      }
    })
    .then( function( schedules ) {
      if( !schedules ) {
        throw new Error( 'no schedules for serialNumber', serialNumber );
      }

      res.json( schedules );
    })
    .catch(function( error ) {
      console.log( 'promise blew up in getMediaScheduleBySerialNumber', error );
      res.status( 500 ).send( error );
    });

  },

  // local use only (other controllers on this server can use these functions)
  deleteMediaScheduleByKin: deleteMediaScheduleByKin,
  addMediaScheduleLocal: addMediaScheduleLocal,
  getMediaScheduleByKinLocal: getMediaScheduleByKinLocal,
  replaceMediaScheduleLocal: replaceMediaScheduleLocal,
};
