var mediaPresentation = require( '../../models').media_presentation;
var mediaSchedule = require( '../../models' ).media_schedule;
var station = require( '../../models').station;
var async = require( 'async' );
var Q = require( 'q' );

module.exports = exports = {
  formatMediaSlidesForPresentations: function( presentations, keyToGet ) {
    var deferred = Q.defer();

    if( !presentations ) {
      deferred.reject( 'No presentations found' );
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

    // loop over presentations
    async.each( makeObjectIntoArray( presentations ), function( presentation, callback ) {
      // get media slides for each presentation
      presentation.contents.getMediaSlides()
      .then( function( slideData ) {
        var slidesById = {};

        // make id: value pair from each slide
        for( var i=0; i<slideData.length; i++ ) {
          var slideId = slideData[ i ].dataValues.id;
          var slideValue = slideData[ i ].dataValues[ keyToGet ];
          // slideIds.push( slideData[ i ].dataValues[ keyToGet ] );
          slidesById[ slideId ] = slideValue;
        }

        //order the urls
        var orderedURLs = [];
        var slideOrder = presentation.contents.dataValues.slide_order;
        for( var i=0; i<slideOrder.length; i++ ) {
          var slideId = slideOrder[ i ];
          if( !slidesById[ slideId ] ) {
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
        deferred.reject( 'Slides are missing.' );
      } else {
        deferred.resolve( presentations );
      }
    });

    return deferred.promise;
  },
  getMediaPresentations: function( whereObject, keyToGet ) {
    var query = whereObject || {};

    return mediaPresentation.findAll( query )
    .then(function( mediaPresentations ) {
      return exports.formatMediaSlidesForPresentations( mediaPresentations, keyToGet );
    });
  },
  // Used by Station Manager
  getAllMediaPresentations: function ( req, res ) {
    exports.getMediaPresentations( null, 'id' )
    .then(function( formattedPresentations ) {
      res.json( formattedPresentations );
    })
    .catch(function( error ) {
      res.status( 500 ).send( error );
    });
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

        return presentation.addMediaSlides( mediaSlideIds )
        .then(function() {
          return Q( created );
        });
      } else {
        return Q( created );
      }

    })
    .then(function( wasCreated ) {
      // send boolean
      res.json( { successfullyAddedmediaPresentation: wasCreated } );
    })
    .catch(function( error ) {
      res.status( 500 ).send( error );
    });
  },

  // Will be used by Station Manager in the future
  deleteMediaPresentation: function( req, res ) {
    mediaPresentation.destroy( { where: { id: req.params.id } } )
    .then( function( numberDestroyed ) {
      if ( numberDestroyed !== 1 ) {
        throw new Error( 'Wrong number of media presentations destroyed: ' + numberDestroyed );
      } else {
        res.json( numberDestroyed );
      }
    })
    .catch( function( error ) {
      res.status( 500 ).send( error.message );
    });
  },

  // Used by Media Player
  getMediaPresentationById: function( req, res ) {
    exports.getMediaPresentations( { where: { id: req.params.id } }, 'mediaUrl' )
    .then(function( oneMediaPresentation ) {
      res.json( oneMediaPresentation );
    })
    .catch(function( error ) {
      res.status( 500 ).send( error );
    });
  },

  // getMediaPresentationsWithSlides

};
