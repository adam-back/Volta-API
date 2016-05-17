var mediaPresentation = require( '../../models').media_presentation;
var mediaSchedule = require( '../../models' ).media_schedule;
var station = require( '../../models' ).station;
var mediaScheduleFactory = require( '../../factories/media/mediaScheduleFactory' );
var sequelize = require( '../../models' ).sequelize;

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

    mediaScheduleFactory.replaceMediaScheduleLocal( schedule )
    .then( function( newSchedule ) {
      res.json( newSchedule );
    })
    .catch( function( error ) {
      res.status( 500 ).send( error.message );
    });
  },

  // Used my Station Manager
  addMediaSchedule: function ( req, res ) {
    // Validate that a station with same KIN doesn't exist, create it
    mediaSchedule.findOrCreate( { where: { kin: req.body.kin }, defaults: req.body } )
    .spread(function( schedule, created ) {
      if( created ) {
        var scheduleJSON = JSON.parse( schedule.schedule );
        schedule.setMediaPresentations( [ scheduleJSON.presentation ] );
        res.json( { successfullyAddedMediaSchedule: created } );
      } else {
        throw new Error ( 'Schedule already exists for kin ' + req.body.kin );
      }
    })
    .catch( function( error ) {
      res.status( 500 ).send( error.message );
    });
  },

  // Will be used by Station Manager (Isn't currently...)
  setMediaScheduleSerialNumber: function( req, res ) {
    mediaSchedule.findOne( { where: { kin: req.body.kin } } )
    .then(function( mediaScheduleToUpdate ) {
      if ( mediaScheduleToUpdate ) {
        for ( var i = 0; i < req.body.changes.length; i++ ) {
          var field = req.body.changes[ i ][ 0 ];
          var newData = req.body.changes[ i ][ 2 ];
          mediaScheduleToUpdate[ field ] = newData;
        }
        return mediaScheduleToUpdate.save();
      } else {
        throw new Error( 'No Media Schedule found for kin ' + req.body.kin );
      }
    })
    .then(function( successmediaSchedule ) {
      res.json( successmediaSchedule );
    })
    .catch(function( error ) {
      if ( error.message.match( /No Media Schedule/ ) !== null ) {
        res.status( 404 ).send( error.message );
      } else {
        res.status( 500 ).send( error.message );
      }
    });
  },

  // Used by Media Player
  getMediaScheduleBySerialNumber: function( req, res ) {
    var serialNumber = req.params.serialNumber;

    // log the time of the last check for a media schedule update
    // run a cron job to check if any of the media players have not
    //  checked for updates within the past N minutes
    mediaSchedule.findOne( { where: { serial_number: serialNumber } } )
    .then(function( mediaScheduleToUpdate ) {
      if ( mediaScheduleToUpdate ) {
        console.log('\n\nUpdating ' + serialNumber, mediaScheduleToUpdate);
        mediaScheduleToUpdate.last_check_in = sequelize.fn('NOW');
        return mediaScheduleToUpdate.save();
      } else {
        throw new Error( 'No Media Schedule found for serial_number ' + serialNumber );
      }
    })
    .then(function( schedule ) {
      if( !schedule ) {
        throw new Error( 'No schedules for serialNumber ' + serialNumber );
      } else {
        console.log('\n\nResponding with updated schedule')
        res.json( [ schedule ] );
      }
    })
    .catch(function( error ) {
      res.status( 500 ).send( error.message );
    });
  },

  getMediaPlayersInNeedOfMaintenance: function( req, res ) {
    mediaScheduleFactory.getMediaPlayersThatHaveGoneAWOL()
    .then( function( schedules ) {
      res.json( {
        haveNotCheckedIn: schedules
      });
    })
    .catch(function( error ) {
      res.status( 500 ).send( 'Failed to check for media players that are in need of maintenance: ' + error.message );
    });
  }
};
