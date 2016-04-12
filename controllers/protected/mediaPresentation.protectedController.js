var request = require( 'request' );
var mediaPresentation = require( '../../models').media_presentation;
var mediaSchedule = require( '../../models' ).media_schedule;
var station = require( '../../models').station;
var express = require( 'express' );
var async = require( 'async' );

//DO NOT ALTER, MEDIA PLAYERS IN THE FIELD RELY ON THIS!
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

module.exports = exports = {
  // Used by Station Manager
  getAllMediaPresentations: function ( req, res ) {
    getMediaPresentations( req, res, null, 'id' );
  },

  // Used by Station Manager
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

    mediaPresentation.findOrCreate( { where: { name: newPresentation.name }, defaults: newPresentation } )
    .spread(function( presentation, created ) {
      //add slides
      if( created ) {
        //get media_slide_id from media slides
        var mediaSlideIds = [];
        for( var i=0; i<req.body.mediaSlides.length; i++ ) {
          // mediaSlideIds.push( req.body.mediaSlides[ i ].id );
          mediaSlideIds.push( req.body.mediaSlides[ i ].id );
        }

        presentation.addMediaSlides( mediaSlideIds );
      }

      // send boolean
      res.json( { successfullyAddedmediaPresentation: created } );
    });
  },

  // Will be used by Station Manager in the future
  deleteMediaPresentation: function( req, res ) {
    var id = req.params.id;
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

  // Used by Media Player
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
