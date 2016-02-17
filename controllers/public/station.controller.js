var station = require( '../../models' ).station;
var io = require( '../../server' ).io;

module.exports = exports = {
  getAllStations: function ( req, res ) {
    // query database for all rows of stations
    station.findAll()
    .then(function( stations ) {
      // respond json with all data
      res.json( stations );
    })
    .catch(function( error ) {
      res.status( 500 ).send( error );
    });
  },
  getOneStation: function( req, res ) {
    // query database for all rows of stations
    station.findOne( { where: { kin: req.url.substring(1) } } )
    .then(function( oneStation ) {
      // if found
      if( oneStation.length === 0 ) {
        res.status( 404 ).send( '<p>A station with that KIN was not found.</p>' );
      } else {
        res.json( oneStation );
      }
    })
    .catch(function( error ) {
      res.status( 500 ).send( error );
    });
  },
  //Kill switch - DO NOT CHANGE!
  setStationStatus: function (req, res) {
    if ( !io ) {
      var io = require( '../../server' ).io;
    }

    //Emit only the station_status to killerPi to reduce bandwidth
    io.sockets.emit( req.params.kin, { status: req.body.station_status } ); 

    station.update( req.body, { where: { kin: req.params.kin } } );
    res.json('Update Complete');
  }
};