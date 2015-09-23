//NEED TO BE SENT AN ENTIRE SCHEDULE NOT JUST DELTAS!
var station_schedule = require( '../models' ).station_schedule;
var station = require( '../models' ).station;

//receivedOnOffSchedule({'Monday':{on_time_utc:new Date().toUTCString(), off_time_utc:new Date().toUTCString()}});
//{ Monday: {off_time_utc, on_time_utc} }
var receivedOnOffSchedule = function( schedule ) {

	var allNewDailySchedules = [];
	var kin = schedule[ 'kin' ];

	var today = new Date();
	var newSchedule = {};
	for( var day in schedule ) {
		
		if( day === 'kin' || day === 'network' ) {
			continue;
		}

		newSchedule[ day ] = schedule[ day ];
	}

	updateScheduleInDatabase( newSchedule, kin );

	//TO DO: 
	//Emit changes to sockets (KillSwitch GUIs should be updated immediately)
};

var updateScheduleInDatabase = function( newSchedule, kin ) {
	var update = {};
	update.kin = kin;

  //monday_on_time: DataTypes.STRING,
  //monday_off_time: DataTypes.STRING,
	for( day in newSchedule ) {
		update[ day.toLowerCase() + '_on_time' ] = JSON.stringify( newSchedule[ day ].on_time );
		update[ day.toLowerCase() + '_off_time' ] = JSON.stringify( newSchedule[ day ].off_time );
	}

  station_schedule.findOrCreate( { where: { kin: kin }, defaults: update } )
  .spread( function(station_schedule, created ) {
  	// if there is already a station_schedule for this kin, update it
  	if( !created ) {
  		station_schedule.update( update, { where: { kin: kin } } );
  	}
  });
};

module.exports = exports = {
	receivedOnOffSchedule: receivedOnOffSchedule
};



