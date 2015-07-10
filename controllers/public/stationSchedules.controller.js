var station_schedule = require( '../../models' ).station_schedule;
var receivedOnOffSchedule = require( '../../factories/scheduleFactory' ).receivedOnOffSchedule;
var express = require( 'express' );

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
    console.log('schedule received ', req.body.schedules);
    receivedOnOffSchedule(req.body.schedules);
    
    //scheduleFactory handles the Database updates for schedules
    res.json('Update Complete');
	}
}