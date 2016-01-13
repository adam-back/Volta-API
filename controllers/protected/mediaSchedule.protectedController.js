var request = require( 'request' );
var mediaPresentation = require( '../../models').media_presentation;
var mediaSchedule = require( '../../models' ).media_schedule;
var station = require( '../../models').station;
var express = require( 'express' );
var async     = require( 'async' );
var q = require( 'q');
// var chainer = new Sequelize.Utils.QueryChainer;

var updateMediaScheduleHelper = function( req, res, where ) {
  var foundMediaSchedule = function( mediaScheduleToUpdate ) {

      for( var key in req.body ) {
        mediaScheduleToUpdate[ key ] = req.body[ key ];
      }

      // remove presentations
      var presentation = mediaScheduleToUpdate.schedule.presentation;
      delete mediaScheduleToUpdate.schedule.presentation;

      mediaScheduleToUpdate.schedule = JSON.stringify( mediaScheduleToUpdate.schedule );
      // for ( var i = 0; i < req.body.changes.length; i++ ) {
      //   var field = req.body.changes[ i ][ 0 ];
      //   var newData = req.body.changes[ i ][ 2 ];
      //   mediaScheduleToUpdate[ field ] = newData;
      // }

      mediaScheduleToUpdate.save()
      .then(function( successMediaSchedule ) {
        console.log( 'presentation var', presentation );
        console.log( 'presentation direct', mediaScheduleToUpdate.schedule.presentation );
        successMediaSchedule.setMediaPresentations([ presentation.id ])
        .then( function( presentation ) {
          res.json( successMediaSchedule );
        })
        .catch( function( error ) {
          throw error;
        })
      })
      .catch(function( error ) {
        console.log( 'error', error );
        // var query = {};
        // // get the title that of the colum that errored
        // var errorColumn = Object.keys( error.fields );
        // // get the value that errored
        // var duplicateValue = error.fields[ errorColumn ];
        // query[ errorColumn ] = duplicateValue;

        // // where conflicting key, value
        // mediaSchedule.find( { where: query } )
        // .then(function( duplicatemediaSchedule ) {
        //   error.duplicatemediaSchedule = duplicatemediaSchedule;
        // 409 = conflict
        res.status( 409 ).send( error );
      })
    };

  if( where ) {
    mediaSchedule.find( where )
    .then( foundMediaSchedule )
    .catch(function( error ) {
      console.log( 'promise error', error );
      res.status( 500 ).send( error );
    });
  } else {
    mediaSchedule.find()
    .then( foundMediaSchedule )
    .catch(function( error ) {
      console.log( 'promise error', error );
      res.status( 500 ).send( error );
    });
  }
}

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

      for( var i=0; i<schedules.length; i++ ) {
        presentationPromises.push( schedules[ i ].getMediaPresentations() );
      }

      q.all( presentationPromises )
      .then( function( presentations ) {
        for( var i=0; i<presentations.length; i++ ) {
          schedules[ i ].dataValues.presentations = presentations[ i ];
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

  addMediaSchedule: function ( req, res ) {
    // Validate that a station with same KIN doesn't exist, create it
    // console.log( 'add schedule - body: ', req.body );
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
      return [ schedule, schedule.getMediaPresentations() ];
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