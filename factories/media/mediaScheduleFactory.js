var Q = require( 'q' );
var sequelize = require( '../../models' ).sequelize;
var mediaSchedule = require( '../../models' ).media_schedule;
var mediaPresentation = require( '../../models').media_presentation;

// Used by Station Manager (through replaceMediaScheduleLocal)
exports.deleteMediaScheduleByKin = function( kin ) {
  return mediaSchedule.destroy( { where: { kin: kin } } );
};

// Used by Station Manager (through replaceMediaScheduleLocal)
exports.addMediaScheduleLocal = function ( schedule ) {
  // spreads to ( user, created )
  return mediaSchedule.findOrCreate( { where: { kin: schedule.kin }, defaults: schedule } );
};

// Used by Station Manager (through replaceMediaScheduleLocal)
exports.getMediaScheduleByKinLocal = function ( kin ) {
  return mediaSchedule.findAll( { where: { kin: kin } } );
};

// Used by Station Manager
exports.replaceMediaScheduleLocal = function( newSchedule ) {
  // get presentation
  var presentation = newSchedule.schedule.presentation;
  delete newSchedule.schedule.presentation;

  // add presentation to schedule
  newSchedule.schedule.presentation = presentation.id;
  newSchedule.media_presentation_id = presentation.id;

  // Stringify so that the schedule can be saved to the database
  newSchedule.schedule = JSON.stringify( newSchedule.schedule );

  // find and delete existing media schedule

  return exports.deleteMediaScheduleByKin( newSchedule.kin )
  // add the new media schedule to replace the deleted one
  .then( function( numberDeleted ) {
    return exports.addMediaScheduleLocal( newSchedule );
  })
  // return the media schedule with its specified presentation
  .spread( function( addedSchedule, wasCreated ) {
    return mediaPresentation.findAll( { where: { id: presentation.id } } )
    .then( function( presentations ) {
      var rawAddedSchedule = addedSchedule.get( { plain: true } );
      rawAddedSchedule.presentations = presentations;
      return rawAddedSchedule;
    });
  });
};

exports.getMediaPlayersThatHaveGoneAWOL = function() {
  var twoHoursAgo = new Date();
  twoHoursAgo.setHours(twoHoursAgo.getHours()-2);

  // return all media player schedules where
  // the media player has checked in more than 2 hours ago
  // or the media player has never checked in
  return mediaSchedule.findAll({
    where: sequelize.or(
      {
        last_check_in: {
          $lt: twoHoursAgo
        }
      },
      {
        last_check_in: null
      }
    ),
    raw: true
  });
};
