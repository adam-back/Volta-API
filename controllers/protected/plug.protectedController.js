var request = require( 'request' );
var plug = require( '../../models').plug;
var station = require( '../../models').station;
var express = require( 'express' );
var Q = require( 'q' );

module.exports = exports = {
  getAllPlugs: function ( req, res ) {
    // query database for all rows of plugs
    plug.findAll()
    .then(function( plugs ) {
      var orderedByStation = {};
      for ( var i = 0; i < plugs.length; i++ ) {
        var stationId = plugs[ i ].station_id;

        // if the station already has a plug
        if ( orderedByStation[ stationId ] ) {
          // add to it
          orderedByStation[ stationId ].push( plugs[ i ] );
        // if it isn't added yet
        } else {
          // start it
          orderedByStation[ stationId ] = [ plugs[ i ] ];
        }
      }
      res.json( orderedByStation );
    })
    .catch(function( error ) {
      res.status( 500 ).send( error );
    });
  },
  getOnePlug: function ( req, res ) {
    // query database for a plug by its id
    plug.find( { where: { id: req.url.substring( 1 ) } } )
    .then(function( plug ) {
      if( plug ) {
        res.json( plug );
      } else {
        res.status( 404 ).send( 'Plug with that id not found in database.' );
      }
    })
    .catch(function( error ) {
      res.status( 500 ).send( error );
    });
  },
  addPlug: function( req, res ) {
    // Get the station so you can associate it
    station.find( { where: { kin: req.body.kin } } )
    .then(function( station ) {
      // kin is not part of plug schema
      delete req.body.kin;
      // Validate that a plug with same omnimeter doesn't exist, create it
      plug.findOrCreate( { where: { ekm_omnimeter_serial: req.body.ekm_omnimeter_serial }, defaults: req.body } )
      .spread(function( plug, created ) {
        if( created ) {
          // associate
          station.addPlug( plug );
          // send boolean
          res.json( { successfullyAddedPlug: created } );
        } else {
          // 409 = conflict
          res.status( 409 ).send( plug );
        }
      });
    })
    .catch(function( error ) {
      res.status( 500 ).send( error );
    });
  },
  updatePlug: function(req, res) {
    // object looks like:
    // { kin: #, changes: [ [ field, old, new ], [ field, old, new ] ] }
    plug.find( { where: { ekm_omnimeter_serial: req.body.serialNumber, id: { $ne: req.body.id } } } )
    .then(function( searchResult ) {
      if( searchResult ) {
        // throw error
        throw searchResult;
      // ok to add
      } else {
        return plug.find( { where: { id: req.body.id } } );
      }
    })
    .then(function( plugToUpdate ) {
      for ( var i = 0; i < req.body.changes.length; i++ ) {
        var field = req.body.changes[ i ][ 0 ];
        var newData = req.body.changes[ i ][ 2 ];
        plugToUpdate[ field ] = newData;
      }

      return plugToUpdate.save();
    })
    .then(function( success ) {
      res.status( 204 ).send();
    })
    .catch(function( error ) {
      var text = {};
      text.title = 'Duplicate Error';
      text.message = 'There was already plug with the same omnimeter serial number.';
      text.duplicateId = error.id;
      res.status( 409 ).send( text );
    });
  },
  deletePlug: function(req,res) {
    var decrementAbove;
    // find the plug
    plug.find( { where: { id: req.url.substring( 1 ) } } )
    .then(function( foundPlug ) {
      // if the plug exists
      if( foundPlug ) {
        decrementAbove = foundPlug.number_on_station;
        // find its associated station
        return station.find( { where: { id: foundPlug.station_id } } )
        .then(function( foundStation ) {
          // if you find the station
          if( foundStation ) {
            // disconnect association

            return foundStation.removePlug( foundPlug )
            .then(function() {
              console.log( 'before destroy' );
              // remove the plug from the db
              return foundPlug.destroy();
            })
            .then(function() {
              var inUse = foundStation.in_use;
              inUse.splice( foundPlug.number_on_station - 1, 1 );

              // get rid of that plug in that station's in_use array
              // if we've taken away the last plug
              if ( inUse.length === 0 ) {
                inUse = null;
              }

              return foundStation.update( { in_use: inUse } );
            });
          } else {
            throw 'There is no station association for plug';
          }
        });
        // station is done
      } else {
        // else it doesn't exist
        res.status( 404 ).send( 'A plug with that id could not be found' );
      }
    })
    .then(function( updatedStation ) {
      return updatedStation.getPlugs();
    })
    .then(function( plugs ) {
      // all the plugs now associated with the station
      if ( plugs ) {
        // fill with starting promise
        var toUpdate = [ Q.when() ];
        // for each plug
        for ( var i = 0; i < plugs.length; i++ ) {
          var onePlug = plugs[ i ];
          // if the plug is anything more than 1
          if ( onePlug.number_on_station > decrementAbove ) {
            // it needs to be decremented
            toUpdate.push( onePlug.decrement( 'number_on_station' ) );
          }
        }

        // when they're all decremented
        return Q.all( toUpdate );

      // no plugs anymore
      } else {
        return Q.when( null );
      }
    })
    .then(function() {
      res.status( 204 ).send();
    })
    .catch(function( error ) {
      res.status( 500 ).send( error );
    });
  }
};