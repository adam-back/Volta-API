var user = require( '../../models' ).user;
var station = require( '../../models' ).station;
var Q = require( 'q' );
var appFactory = require( '../../factories/appFactory.js' );
var geocodeCache = require( '../../factories/geocodeCache.js' );

module.exports = exports = {
  getFavoriteStations: function( req, res ) {
    if ( req.query.id ) {
      user.findOne( { where: { id: req.query.id } } )
      .then(function( foundUser ) {
        console.log( 'foundUser', foundUser );
        if ( foundUser && foundUser.favorite_stations && foundUser.favorite_stations.length > 0 ) {
          return appFactory.formatStationsForApp( { where: { id: { $in: foundUser.favorite_stations } } }, foundUser.id, req.query.userCoords );
        } else {
          return Q( [] );
        }
      })
      .then(function( formattedStations ) {
        res.json( formattedStations );
      })
      .catch(function( error ) {
        res.status( 500 ).send( error.message );
      });
    } else {
      res.status( 500 ).send( 'No user id sent.' );
    }
  },
  addFavoriteStation: function( req, res ) {
    // get stations associated with that cut kin
    station.findAll( { where: { id: { $in: req.body.group } } } )
    .then(function( stations ) {
      return user.find( { where: { id: req.body.userId } } )
      .then(function( user ) {
        var favorites = user.favorite_stations || [];
        // add stations to user favorites
        var numberOfStations = stations.length;
        for ( var i = 0; i < numberOfStations; i++ ) {
          favorites.push( stations[ i ].id );
        }

        return user.updateAttributes( { 'favorite_stations': favorites } );
      });
    })
    .then(function() {
      res.send();
    })
    .catch(function( error ) {
      res.status( 500 ).send( error.message );
    });
  },
  removeFavoriteStation: function( req, res ) {
    user.find( { where: { id: req.body.userId } } )
    .then(function( user ) {
      var favorites = user.favorite_stations;
      var idsToRemove = {};
      var newFavorites = [];

      for ( var i = 0; i < req.body.group.length; i++ ) {
        idsToRemove[ req.body.group[ i ] ] = true;
      }

      for ( var j = 0; j < favorites.length; j++ ) {
        if ( idsToRemove[ favorites[ j ] ] !== true ) {
          newFavorites.push( favorites[ j ] );
        }
      }

      return user.updateAttributes( { 'favorite_stations': newFavorites } );
    })
    .then(function() {
      res.send();
    })
    .catch(function( error ) {
      res.status( 500 ).send( error.message );
    });
  }
};