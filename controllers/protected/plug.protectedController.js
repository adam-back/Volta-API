var plug = require( '../../models').plug;
var station = require( '../../models').station;
var Q = require( 'q' );

module.exports = exports = {
  getAllPlugs: function ( req, res ) {
    // query database for all rows of plugs
    plug.findAll( { raw: true } )
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
      res.status( 500 ).send( error.message );
    });
  },
  getOnePlug: function ( req, res ) {
    // query database for a plug by its id
    plug.findOne( { where: { id: Number( req.params.id ) }, raw: true } )
    .then(function( plug ) {
      if( plug ) {
        res.json( plug );
      } else {
        res.status( 404 ).send( 'Plug with that id not found in database.' );
      }
    })
    .catch(function( error ) {
      res.status( 500 ).send( error.message );
    });
  },
  addPlug: function( req, res ) {
    // Get the station so you can associate it
    station.findOne( { where: { kin: req.body.kin } } )
    .then(function( foundStation ) {
      if ( foundStation ) {
        return Q( foundStation );
      } else {
        throw new Error( 'No station found for kin ' + req.body.kin );
      }
    })
    .then(function( stationWithPlug ) {
      // kin is not part of plug schema
      delete req.body.kin;
      // Validate that a plug with same omnimeter doesn't exist, create it
      return plug.findOrCreate( { where: { ekm_omnimeter_serial: req.body.ekm_omnimeter_serial }, defaults: req.body } )
      .spread(function( foundPlug, created ) {
        if( created ) {
          // associate
          return stationWithPlug.addPlug( foundPlug )
          .then(function() {
            // send boolean
            res.json( { successfullyAddedPlug: created } );
          });
        } else {
          // 409 = conflict
          res.status( 409 ).send( foundPlug );
        }
      });
    })
    .catch(function( error ) {
      res.status( 500 ).send( error.message );
    });
  },
  updatePlug: function(req, res) {
    // object looks like:
    // { kin: #, changes: [ [ field, old, new ], [ field, old, new ] ] }
    plug.findOne( { where: { ekm_omnimeter_serial: req.body.serialNumber, id: { $ne: req.body.id } }, raw: true } )
    .then(function( searchResult ) {
      if( searchResult ) {
        // throw error
        var text = {};
        text.title = 'Duplicate Error';
        text.message = 'There was already plug with the same omnimeter serial number.';
        text.duplicateId = searchResult.id;
        res.status( 409 ).send( text );
      // ok to add
      } else {
        return plug.findOne( { where: { id: req.body.id } } )
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
        });
      }
    })
    .catch(function( error ) {
      res.status( 500 ).send( error.message );
    });
  },
  deletePlug: function(req,res) {
    var decrementAbove;
    // find the plug
    plug.findOne( { where: { id: Number( req.params.id ) } } )
    .then(function( foundPlug ) {
      // if the plug exists
      if( foundPlug ) {
        decrementAbove = foundPlug.number_on_station;
        // find its associated station
        return station.findOne( { where: { id: foundPlug.station_id } } )
        .then(function( foundStation ) {
          // if you find the station
          if( foundStation ) {
            // disconnect association
            return foundStation.removePlug( foundPlug )
            .then(function() {
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
            throw new Error( 'There is no station association for plug ' + foundPlug.id );
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
      if ( plugs.length > 0 ) {
        // fill with starting promise
        var toUpdate = [ Q() ];
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
        return Q();
      }
    })
    .then(function() {
      res.status( 204 ).send();
    })
    .catch(function( error ) {
      res.status( 500 ).send( error.message );
    });
  }
};