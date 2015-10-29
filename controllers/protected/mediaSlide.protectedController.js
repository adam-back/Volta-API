var request = require( 'request' );
// var mediaPresentation = require( '../../models').media_presentation;
// var mediaSchedule = require( '../../models' ).media_schedule;
var mediaSlide = require( '../../models' ).media_slide;
// var station = require( '../../models').station;
var express = require( 'express' );
var async     = require( 'async' );
// var chainer = new Sequelize.Utils.QueryChainer;

// NOTE: uses query instead of params
module.exports = exports = {
  getAllMediaSlides: function ( req, res ) {
    mediaSlide.findAll()
    .then( function( Slides ) {
      res.json( Slides );
    })
    .catch(function( error ) {
      console.log( 'promise blew up', error );
      res.status( 500 ).send( error );
    });
  },

  addMediaSlide: function ( req, res ) {
    // Validate that a station with same KIN doesn't exist, create it
    mediaSlide.findOrCreate( { where: { name: req.body.name }, defaults: req.body } )
    .spread(function( Slide, created ) {
      // send boolean
      res.json( Slide );
    });
  },

  updateMediaSlide: function ( req, res ) {
    mediaSlide.find( { where: { id: req.body.id } } )
    .then(function( mediaSlideToUpdate ) {
      if( mediaSlideToUpdate ) {
        return mediaSlideToUpdate.updateAttributes( req.body );
      } else {
        throw 'No Media Slide Found With ID: ' + req.body.id;
      }
      // for ( var i = 0; i < req.body.changes.length; i++ ) {
      //   var field = req.body.changes[ i ][ 0 ];
      //   var newData = req.body.changes[ i ][ 2 ];
      //   mediaSlideToUpdate[ field ] = newData;
      // }

      // mediaSlideToUpdate.save()
      // .then(function( successmediaSlide ) {
      //   res.json( successmediaSlide );
      // })
      // .catch(function( error ) {
      //   var query = {};
      //   // get the title that of the colum that errored
      //   var errorColumn = Object.keys( error.fields );
      //   // get the value that errored
      //   var duplicateValue = error.fields[ errorColumn ];
      //   query[ errorColumn ] = duplicateValue;

      //   // where conflicting key, value
      //   mediaSlide.find( { where: query } )
      //   .then(function( duplicatemediaSlide ) {
      //     error.duplicatemediaSlide = duplicatemediaSlide;
      //     // 409 = conflict
      //     res.status( 409 ).send( error );
      //   })
      //   .catch(function( error ) {
      //     res.status( 500 ).send( error );
      //   });
      // });
    })
    .then( function( mediaSlide ) {
      res.json( mediaSlide );
    })
    .catch(function( error ) {
      res.status( 500 ).send( error );
    });
  }
};