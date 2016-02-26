var station = require( '../../models').station;
var station_report = require( '../../models' ).station_report;
var station_image = require( '../../models' ).station_image;
var user = require( '../../models' ).user;
var app_sponsor = require( '../../models' ).app_sponsor;
var cache = require( '../../factories/geocodeCache.js' );
var appFactory = require( '../../factories/appFactory.js' );
var async     = require( 'async' );
var Q = require( 'q' );
var env = process.env.NODE_ENV || 'development';
var config    = require( '../../config/config' )[ env ];
var geocoder = require( 'node-geocoder' )( 'google', 'https', { apiKey: config.googleApiKey, formatter: null } );

module.exports = exports = {
  getStationsAndPlugs: function ( req, res ) {
    var readyForReturn = [];
    // get all stations
    station.findAll()
    .then(function( stations ) {
      return appFactory.connectStationsWithPlugsAndSponsors( stations );
    })
    .then(function( stationsAndPlugs ) {
      // if the user is logged in
      if ( req.query.id ) {
        // get their favorites
        return user.find( { where: { id: req.query.id } } )
        .then(function( foundUser ) {
          return Q( appFactory.groupByKin( stationsAndPlugs, foundUser.favorite_stations ) );
        });
      // not logged in
      } else {
        // group similar stations by kin
        return Q( appFactory.groupByKin( stationsAndPlugs ) );
      }
    })
    .then(function( groupedKin ) {
      return appFactory.attachImages( groupedKin );
    })
    .then(function( groupsWithImages ) {
      // add stations with GPS to ready
      for ( var kin in groupsWithImages ) {
        if ( Array.isArray( groupsWithImages[ kin ].gps ) ) {
          readyForReturn.push( groupsWithImages[ kin ] );
          // delete it so it won't get geocoded
          delete groupsWithImages[ kin ];
        }
      }
      // send the rest to be geocoded
      return cache.geocodeGroupsWithoutGPS( groupsWithImages );
    })
    .then(function( geocoded ) {
      readyForReturn = readyForReturn.concat( geocoded );

      // measure as-the-crow flies distances
      if ( req.query.userCoords ) {
        res.json( appFactory.findDistances( req.query.userCoords, readyForReturn ) );
      } else {
        res.json( readyForReturn );
      }
    })
    .catch(function( error ) {
      res.status( 500 ).send( error );
    });
  },
  saveReport: function ( req, res ) {
    station_report.create( req.body )
    .then(function( success ) {
      res.status( 204 ).send(); // needs to be this for iOS app
    })
    .catch(function( error ) {
      res.status( 500 ).send( error );
    });
  },
  getAppSponsors: function ( req, res ) {
    // app_sponsor.create( { company: 'Chevrolet', networks: [ 'SD', 'OC', 'LA', 'SB', 'NoCal' ], website_url: 'http://www.chevrolet.com/', twitter_url: 'https://twitter.com/chevyvolt', facebook_url: 'https://www.facebook.com/chevroletvolt/info?tab=page_info', instagram_url: 'https://instagram.com/chevrolet/?hl=en', logo_url: 'http://img2.wikia.nocookie.net/__cb20141116144915/logopedia/images/f/f4/Chevrolet_logo-2.png', station_query: { where: { network: { $in: [ 'SD', 'OC', 'LA', 'SB', 'NoCAl' ] } } }, banner_url: 'http://cdn.realestate.ph/ad3_320x50.jpg', current: true, order: 3 } );

    // Create associations
    // app_sponsor.findAll( { where: { company: 'Chevrolet' } } )
    // .then(function( sponsor ) {
    //   // remove previous associations
    //   return sponsor[ 0 ].setStations( [] )
    //   .then(function() {
    //     // get all the stations per the query
    //     return station.findAll( sponsor[ 0 ].dataValues.station_query );
    //   })
    //   .then(function( stations ) {
    //     // readd
    //     return sponsor[ 0 ].addStations( stations );
    //   });
    // })
    // .then(function( done ) {
    //   res.send( done );
    // })

    app_sponsor.findAll( { where: { current: true }, order: [ 'order' ] } )
    .then(function( sponsors ) {
      res.send( sponsors );
    })
    .catch(function( error ) {
      res.status( 500 ).send( error );
    });
  }
};