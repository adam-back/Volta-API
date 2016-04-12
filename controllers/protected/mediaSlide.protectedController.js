var mediaSlide = require( '../../models' ).media_slide;

module.exports = exports = {

  // Used by Station Manager
  getAllMediaSlides: function ( req, res ) {
    mediaSlide.findAll()
    .then( function( Slides ) {
      res.json( Slides );
    })
    .catch(function( error ) {
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
    })
    .catch(function( error ) {
      res.status( 500 ).send( error );
    });
  },

  // Will be used by Station Manager in the future
  deleteMediaSlide: function ( req, res ) {
    mediaSlide.destroy({ where: { id: req.params.id } } )
    .then( function( slide ) {
      res.json( slide );
    })
    .catch( function( error ) {
      res.status( 500 ).send( error );
    });
  },
};
