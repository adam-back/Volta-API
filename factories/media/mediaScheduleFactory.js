var Q = require( 'q' );
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
    });
  })
  .catch( function( error ) {
    console.log( '\n\n ERROR', error );
    throw new Error ( 'failed to replace media schedule', error );
  });
};