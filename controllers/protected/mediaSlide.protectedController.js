var request = require( 'request' );
var mediaSlide = require( '../../models' ).media_slide;
var express = require( 'express' );
var async = require( 'async' );

module.exports = exports = {
  
  // Used by Station Manager
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

  // Used by Station Manager
  addMediaSlide: function ( req, res ) {
    // Validate that a station with same KIN doesn't exist, then create it
    mediaSlide.findOrCreate( { where: { name: req.body.name }, defaults: req.body } )
    .spread(function( Slide, created ) {
      // send boolean
      res.json( Slide );
    });
  },

  // Will be used by Station Manager in the future
  deleteMediaSlide: function ( req, res ) {
    console.log( '\n\n DELETE SLIDE #', req.params.id );
    mediaSlide.destroy({ where: { id: req.params.id } } )
    .then( function( slide ) {
      res.json( slide );
    })
    .catch( function( error ) {
      console.log( error );
      res.status( 500 ).send( error );
    });
  },
};
