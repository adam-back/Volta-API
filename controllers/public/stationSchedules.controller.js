var station_schedule = require( '../../models' ).station_schedule;
var receivedOnOffSchedule = require( '../../factories/scheduleFactory' ).receivedOnOffSchedule;
var express = require( 'express' );

var server = require( '../../server' );
var io = require( '../../server' ).io;

module.exports = exports = {
	getSchedule: function ( req, res ) {
	  station_schedule.findOne( { where: { kin: req.url.substring(1) } } )
	  .then(function( stations ) {
	    // respond json with all data
	    res.json( stations );
	  })
	  .catch(function( error ) {
	    res.status( 500 ).send( error );
	  });
	},

	getAllSchedules: function ( req, res ) {
		station_schedule.findAll()
	  .then(function( stations ) {
	    // respond json with all data
	    res.json( stations );
	  })
	  .catch(function( error ) {
	    res.status( 500 ).send( error );
	  });
	},

	//breakout from station controller
	setSchedule: function( req, res ) {
    receivedOnOffSchedule( req.body.schedules, function( savedSchedule ) {
	    //Emit the new schedule
	    io.sockets.emit( req.params.kin, { schedule: savedSchedule } );
	    
	    //scheduleFactory handles the Database updates for schedules
	    res.json('Update Complete');
    });
	}
}