var request = require( 'request' );
var mediaPresentation = require( '../../models').media_presentation;
var mediaSchedule = require( '../../models' ).media_schedule;
var station = require( '../../models').station;
var express = require( 'express' );
var async     = require( 'async' );
var q = require( 'q');
// var chainer = new Sequelize.Utils.QueryChainer;

/* HELPER METHODS */
var deleteMediaScheduleByKin = function( kin ) {
  return mediaSchedule.destroy({
    where: {
      kin: kin
    }
  });
};

// spreads to ( user, created )
var addMediaScheduleLocal = function ( schedule ) {
  return mediaSchedule.findOrCreate( { where: { kin: schedule.kin }, defaults: schedule } )
};

var getMediaScheduleByKinLocal = function ( kin ) {
  return mediaSchedule.findAll( {
    where: {
      kin: kin
    }
  })
};

var replaceMediaScheduleLocal = function( newSchedule ) {
  // get presentation
  var presentation = newSchedule.schedule.presentation
  delete newSchedule.schedule.presentation;
  newSchedule.schedule = JSON.stringify( newSchedule.schedule );
  newSchedule.media_presentation_id = presentation.id;

  // find and delete existing media schedule
  return getMediaScheduleByKinLocal( newSchedule.kin )
  .then( function( schedule ) {
    if( schedule ) {
      return deleteMediaScheduleByKin( newSchedule.kin );
    } else {
      return q();
    }
  })
  .then( function( deletedSchedule ) {
    return addMediaScheduleLocal( newSchedule );
  })
  .spread( function( addedSchedule, wasCreated ) {
    // return the media schedule with its specified presentation
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

// NOTE: uses query instead of params
module.exports = exports = {
  getAllMediaSchedules: function ( req, res ) {
    mediaSchedule.findAll()
    .then( function( schedules ) {
      res.json( schedules );
    })
    .catch(function( error ) {
      console.log( 'promise blew up', error );
      res.status( 500 ).send( error );
    });
  },

  getAllMediaSchedulesWithPresentations: function( req, res ) {
    mediaSchedule.findAll()
    .then( function( schedules ) {
      var presentationPromises = [];

      mediaPresentation.findAll()
      .then( function( presentations ) {
        // convert presentations array to hash table where id is key
        var presentationsHash = {};
        for( var i=0; i< presentations.length; i++ ) {
          var presentation = presentations[ i ];
          presentationsHash[ presentation.id ] = presentation;
        }

        for( var i=0; i<schedules.length; i++ ) {
          var presentationID = schedules[ i ].dataValues.media_presentation_id;
          schedules[ i ].dataValues.presentations = [ presentationsHash[ presentationID ] ];
        }

        res.json( schedules );
      })
      .catch( function( error ) {
        console.log( '\n\n getAllMediaSchedulesWithPresentations - error', error, '\n\n' );
        throw error;
      });

    })
    .catch( function( error ) {
      console.log( 'getAllMediaSchedulesWithPresentations - failed to getAllMediaSchedulesWithPresentations', error );
      res.status( 500 ).send( error );
    })
  },

  deleteMediaSchedule: function( req, res ) {
    var id = req.params.id;

    mediaSchedule.destroy({
      where: {
        id: id
      }
    })
    .then( function( schedule ) {
      res.json( schedule );
    })
    .catch( function( error ) {
      res.status( 500 ).send( error );
    });
  },

  // local use only
  deleteMediaScheduleByKin: deleteMediaScheduleByKin,
  addMediaScheduleLocal: addMediaScheduleLocal,
  getMediaScheduleByKinLocal: getMediaScheduleByKinLocal,
  replaceMediaScheduleLocal: replaceMediaScheduleLocal,

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

  addMediaSchedule: function ( req, res ) {
    // Validate that a station with same KIN doesn't exist, create it
    mediaSchedule.findOrCreate( { where: { kin: req.body.kin }, defaults: req.body } )
    .spread(function( schedule, created ) {
      // send boolean
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

  // [ DEPRECATE ME! ]
  updateMediaSchedule: function ( req, res ) {
    updateMediaScheduleHelper( req, res, { where: { kin: req.body.kin } } );
  },

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

  getMediaScheduleByKin: function ( req, res ) {
    var kin = req.params.kin;

    mediaSchedule.findAll( {
      where: {
        kin: kin
      }
    })
    .then( function( schedules ) {
      if( !schedules ) {
        throw new Error( 'no schedules' );
      }


      var schedule = JSON.parse( schedules[ 0 ].dataValues.schedule );
      //test
      // schedule.forceRefresh = {
      //   slides: [ 'http://techslides.com/demos/sample-videos/small.webm' ],
      //   presentations: [ 24 ]
      // };
      //end test
      res.json( schedule );
    })
    .catch(function( error ) {
      console.log( 'promise blew up', error );
      res.status( 500 ).send( error );
    });
  },

  getMediaScheduleWithPresentationSlideURLsForKin: function ( req, res ) {
    var kin = req.params.kin;

    station.findAll( {
      where: {
        kin: kin
      }
    })
    .then(function( stations ) {
      if( ! stations || stations.length === 0 ) {
        throw new Error( 'no stations' );
      }
      return stations[ 0 ].getMediaSchedule();
    })
    .then( function( schedules ) {
      if( !schedules ) {
        throw new Error( 'no schedules' );
      }
      var schedule = schedules[ 0 ];

      mediaPresentation.findAll( { where: { id: schedule.dataValues.media_presentation_id } } )
      .then( function( presentations ) {
        return [ schedule, presentations[ 0 ] ];
      })
    })
    .spread( function( schedule, presentations ) {
      if( ! presentations ) {
        if( ! schedule ) {
          throw new Error( 'no schedule or presentations' );
        } else {
          res.json( { schedule: schedule } );
        }
      }
      var calls = [];
      for( presentation in presentations ) {
        calls.push( presentation.getMediaSlides );
      }

      //maintains order in which functions are called, not returned
      async.parallel(calls, function( error, result ) {
        if( error ) {
          console.log( 'async blew up', error );
          res.status( 500 ).send( error );
        } else {
          //got all the things!
          for( var i=0; i<result.length; i++ ) {
            var presentation = presentations[ i ];
            var slides = result[ i ];
            presentation.slideURLs = slides;
          }
          res.json( { schedule: schedule, presentations: presentations } );
        }
      });
      //for each presentation in presentations
      //  add presentation.getMediaSlides() to presentation object
      //return schedule and presentations ( each with media slides )

      res.json( presentations );
    })
    .catch(function( error ) {
      console.log( 'promise blew up', error );
      res.status( 500 ).send( error );
    });
  },

};
