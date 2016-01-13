var request = require( 'request' );
var mediaPresentation = require( '../../models').media_presentation;
var mediaSchedule = require( '../../models' ).media_schedule;
var station = require( '../../models').station;
var express = require( 'express' );
var async = require( 'async' );

//DO NOT ALTER, MEDIA PLAYERS IN FIELD RELY ON THIS!
var getMediaPresentations = function( req, res, whereObject, keyToGet ) {

  var receivedPresentations = function( presentations ) {
    if( !presentations ) {
      throw new Error( 'No presentations found' );
    }

    //get slide ids
    var calls = [];
    var makeObjectIntoArray = function( obj ) {
      var array = [];
      for( var key in obj ) {
        var contents = {};
        contents.key = key; 
        contents.contents = obj[ key ];
        array.push( contents );
      }
      return array;
    };

    async.each( makeObjectIntoArray( presentations ), function( presentation, callback ) {
      presentation.contents.getMediaSlides()
      .then( function( slideData ) {
        // console.log( 'slideData', slideData );

        var slidesById = {};
        // var slideIds = [];

        for( var i=0; i<slideData.length; i++ ) {
          // console.log('slideId: ', slideData[ i ].dataValues[ keyToGet ] );
          var slideId = slideData[ i ].dataValues.id;
          var slideValue = slideData[ i ].dataValues[ keyToGet ];
          // slideIds.push( slideData[ i ].dataValues[ keyToGet ] );
          slidesById[ slideId ] = slideValue;
        }

        // console.log( 'slidesById', slidesById );

        //order the urls
        var orderedURLs = [];
        var slideOrder = presentation.contents.dataValues.slide_order;
        for( var i=0; i<slideOrder.length; i++ ) {
          var slideId = slideOrder[ i ];
          if( !slidesById[ slideId ] ) {
            console.log( 'MISSING SLIDE URL', slideId );
            throw new Error( 'Slide ' + slideId + ' is missing URL' );
          }

          orderedURLs.push( slidesById[ slideId ] );
        }

        // presentation.contents.dataValues.slideIds = slideIds;
        presentation.contents.dataValues.slideIds = orderedURLs;
        callback( null );
      })
      .catch( function( error ) {
        callback( error );
      });
    }, function( error ) {
      if( error ) {
        console.log( '\n\n', error, '\n\n' );
        throw new Error( 'Slides are missing' );
      } else {
        res.json( presentations );
      }
    });
  };

  if( whereObject ) {
    mediaPresentation.findAll( whereObject )
    .then( receivedPresentations )
    .catch( function( error ) {
      console.log( 'YOU BROKE YOUR PROMISE!', error );
      res.status( 500 ).send( error );
    });
  } else {
    mediaPresentation.findAll()
    .then( receivedPresentations )
    .catch( function( error ) {
      console.log( 'YOU BROKE YOUR PROMISE!', error );
      res.status( 500 ).send( error );
    });
  }
};

// NOTE: uses query instead of params
module.exports = exports = {
  getAllMediaPresentations: function ( req, res ) {
    getMediaPresentations( req, res, null, 'id' );
  },
  
  addMediaPresentation: function ( req, res ) {
    // Validate that a station with same KIN doesn't exist, create it
    // need to save the order of the slides here
    // need a new column to maintain order
    // slideOrder [ Strings ]
    var newPresentation = {
      name: req.body.name,
      active: false,
      slide_order: req.body.slideOrder
    };

    console.log( '\n\n ADD PRESENTATION \n\n' );
    // console.log( '\n\n', req.body, '\n\n' );

    mediaPresentation.findOrCreate( { where: { name: newPresentation.name }, defaults: newPresentation } )
    .spread(function( presentation, created ) {
      //add slides
      if( created ) {
        //get media_slide_id from media slides
        var mediaSlideIds = [];
        console.log( 'given slides: ', req.body.mediaSlides );
        for( var i=0; i<req.body.mediaSlides.length; i++ ) {
          // mediaSlideIds.push( req.body.mediaSlides[ i ].id );
          mediaSlideIds.push( req.body.mediaSlides[ i ].id );
        }
        console.log( 'ids:', mediaSlideIds );

        presentation.addMediaSlides( mediaSlideIds );
      }

      console.log( '\n\nNew Presentation: ', presentation, '\n\n' );

      // send boolean
      res.json( { successfullyAddedmediaPresentation: created } );
    });
  },
  
  updateMediaPresentation: function ( req, res ) {
    mediaPresentation.find( { where: { name: req.body.name } } )
    .then(function( mediaPresentationToUpdate ) {
      for ( var i = 0; i < req.body.changes.length; i++ ) {
        var field = req.body.changes[ i ][ 0 ];
        var newData = req.body.changes[ i ][ 2 ];
        mediaPresentationToUpdate[ field ] = newData;
      }

      mediaPresentationToUpdate.save()
      .then(function( successmediaPresentation ) {
        res.json( successmediaPresentation );
      })
      .catch(function( error ) {
        var query = {};
        // get the title that of the colum that errored
        var errorColumn = Object.keys( error.fields );
        // get the value that errored
        var duplicateValue = error.fields[ errorColumn ];
        query[ errorColumn ] = duplicateValue;

        // where conflicting key, value
        mediaPresentation.find( { where: query } )
        .then(function( duplicatemediaPresentation ) {
          error.duplicatemediaPresentation = duplicatemediaPresentation;
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

  getMediaPresentationsByKin: function ( req, res ) {
    var kin = req.query.kin;

    station.findAll( {
      where: {
        kin: kin
      }
    })
    .then( function( stations ) {
      return stations[ 0 ].getMediaSchedules();  
    })
    .then( function( schedules ) {
      return schedules[ 0 ].getMediaPresentations();
    })
    .then( function( presentations ) {
      res.json( presentations );
    })
    .catch(function( error ) {
      res.status( 500 ).send( error );
    });
  },

  // use this one - it is faster
  getMediaPresentationsBySchedule: function ( req, res ) {
    var scheduleId = req.query.scheduleId;

    mediaSchedule.findAll( {
      where: {
        id: scheduleId
      }
    })
    .then( function( schedules ) {
      return schedules[ 0 ].getMediaPresentations();
    })
    .then( function( presentations ) {
      res.json( presentations );
    })
    .catch(function( error ) {
      res.status( 500 ).send( error );
    });
  },

  deleteMediaPresentation: function( req, res ) {
    var id = req.params.id;
    console.log( 'in deleteMediaPresentation' );
    mediaPresentation.destroy({
      where: {
        id: id
      },
    })
    .then( function( presentation ) {
      res.json( presentation );
    })
    .catch( function( error ) {
      console.log( error );
      res.status( 500 ).send( error );
    });
  },

  getMediaPresentationById: function( req, res ) {
    var id = req.params.id;
    getMediaPresentations( req, res, {
      where: {
        id: id
      }
    }, 'mediaUrl' );
  },

  // getMediaPresentationsWithSlides

};