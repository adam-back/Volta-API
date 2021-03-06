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
    mediaSchedule.findOne( { where: { serial_number: serialNumber } } )
    .then(function( mediaScheduleToUpdate ) {
      if ( mediaScheduleToUpdate ) {
        mediaScheduleToUpdate.last_check_in = sequelize.fn('NOW');
        return mediaScheduleToUpdate.save();
      } else {
        throw new Error( 'No Media Schedule found for serial_number ' + serialNumber );
      }
    })
    .then(function( schedule ) {
      res.json( [ schedule ] );
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
  },

  setDownloadedPresentationsBySerialNumber: function( req, res ) {
    var serialNumber = req.params.serialNumber;
    var downloadedPresentations = req.body.downloadedPresentations;

    mediaSchedule.findOne( { where: { serial_number: serialNumber } } )
    .then(function( mediaScheduleToUpdate ) {
      if ( mediaScheduleToUpdate ) {
        mediaScheduleToUpdate.downloaded_presentations = downloadedPresentations;
        return mediaScheduleToUpdate.save();
      } else {
        throw new Error( 'No Media Schedule found for serial_number ' + serialNumber );
      }
    })
    .then(function( schedule ) {
      res.status( 200 ).send("");
    })
    .catch(function( error ) {
      res.status( 500 ).send( error.message );
    });
  },

  setPlayingPresentationBySerialNumber: function( req, res ) {
    var serialNumber = req.params.serialNumber;
    var playingPresentation = req.body.playingPresentation;

    mediaSchedule.findOne( { where: { serial_number: serialNumber } } )
    .then(function( mediaScheduleToUpdate ) {
      if ( mediaScheduleToUpdate ) {
        mediaScheduleToUpdate.playing_presentation = playingPresentation;
        return mediaScheduleToUpdate.save();
      } else {
        throw new Error( 'No Media Schedule found for serial_number ' + serialNumber );
      }
    })
    .then(function( schedule ) {
      res.status( 200 ).send("");
    })
    .catch(function( error ) {
      res.status( 500 ).send( error.message );
    });
  },

  setSlideViewStatus: function( req, res ) {
    var serialNumber = req.params.serialNumber;
    var slidesPlayedRecently = req.body.playedRecently;
    var slidesNotPlayedRecently = req.body.notPlayedRecently;

    mediaSchedule.findOne( { where: { serial_number: serialNumber } } )
    .then(function( mediaScheduleToUpdate ) {
      if( mediaScheduleToUpdate ) {
        mediaScheduleToUpdate.slides_played_recently = slidesPlayedRecently;
        mediaScheduleToUpdate.slides_not_played_recently = slidesNotPlayedRecently;
        return mediaScheduleToUpdate.save();
      } else {
        throw new Error( 'No Media Schedule found for serial_number ' + serialNumber );
      }
    })
    .then(function( schedule ) {
      res.status( 200 ).send("");
    })
    .catch(function( error ) {
      res.status( 500 ).send( error.message );
    });
  }
};
