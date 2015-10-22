var Q = require( 'q' );
var async = require( 'async' );
var AWS = require( 'aws-sdk' );
var s3 = new AWS.S3();
var station = require( '../models').station;
var station_image = require( '../models').station_image;

exports.groupByCommonKin = function( stations ) {
  var commonKins = {};

  for ( var i = 0; i < stations.length; i++ ) {
    var cut = stations[ i ].kin.substring( 0, 12 );
    if ( commonKins[ cut ] === undefined ) {
      commonKins[ cut ] = stations[ i ];
    }
  }

  return commonKins;
};

exports.addS3ImagesToDatabase = function() {
  var deferred = Q.defer();
  var s3LinkPrefix = 'https://s3-us-west-2.amazonaws.com/volta-mobile-assets/';

  // get all stations
  station.findAll( { order: 'kin' } )
  .then(function( stations ) {
    // organize by common kin
    var commonKins = exports.groupByCommonKin( stations );

    // for each common kin
    async.forEachOf(commonKins, function( station, kin, cb ) {
      // list objects with common kin
      s3.listObjects( { Bucket: 'volta-mobile-assets', Prefix: 'gallery/' + kin }, function( error, data ) {
        if ( error ) {
          cb( error );
        } else {
          // if there are images for that group
          if ( data.Contents.length > 0 ) {
            var dbEntries = [];
            // get rid of the folders
            data.Contents.shift(); // removes volta-mobile-assets/gallery/001-0001-001
            data.Contents.shift(); // removes volta-mobile-assets/gallery/001-0001-001/full

            // loop through the objects
            for ( var i = 0; i < data.Contents.length; i++ ) {
              // format for db
              var image = {
                link: s3LinkPrefix + data.Contents[ i ].Key
              };
              dbEntries.push( image );
            }

            // add each object to the station image table
            station_image.bulkCreate( dbEntries )
            .then(function() {
              return station_image.findAll( { where: { link: { $like: '%' + kin + '%' } } } );
            })
            .then(function( images ) {
              // associate with the first station for that common kin
              return station.addStation_images( images );
            })
            .then(function() {
              // done
              cb( null );
            })
            .catch(function( error ) {
              cb( error );
            });

          } else {
            cb( null );
          }
        }
      });
    }, function( error ) {
      if ( error ) {
        throw error;
      } else {
        deferred.resolve();
      }
    });
  })
  .catch(function( error ) {
    deferred.reject( error );
  });

  return deferred.promise;
};