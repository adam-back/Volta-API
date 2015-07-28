//NEED TO BE SENT AN ENTIRE SCHEDULE NOT JUST DELTAS!
var station_schedule = require( '../models' ).station_schedule;
var UpcomingEventsListExports = require( './UpcomingEventList' );
var UpcomingEventsList = UpcomingEventsListExports.UpcomingEventsList;
var ScheduledEvent = UpcomingEventsListExports.ScheduledEvent;
var timezones = require( './timezones' );

var eventsWithinTheHour = [];
var upcomingIntervalsList = new UpcomingEventsList();
var nextEventTimeout;

var dayToNumber = {
  Monday: 0,
  Tuesday: 1,
  Wednesday: 2,
  Thursday: 3,
  Friday: 4,
  Saturday: 5,
  Sunday: 6
};

var datObjectNumberToDay = {
	0: 'Sunday',
	1: 'Monday',
	2: 'Tuesday',
	3: 'Wednesday',
	4: 'Thursday',
	5: 'Friday',
	6: 'Saturday'
};

var allSchedules = {};
var nextIntervalBeginsAt;

//receivedOnOffSchedule({'Monday':{on_time_utc:new Date().toUTCString(), off_time_utc:new Date().toUTCString()}});
//{ Monday: {off_time_utc, on_time_utc} }
var receivedOnOffSchedule = function(schedule) {

	console.log('receivedOnOffSchedule: ', schedule);

	//PERFORM TWO CHECKS
	//WILL EITHER OF THE NEW EVENTS (ON/OFF) OCCUR BEFORE THE NEXT INTERVAL?
	//DOES THIS KIN ALREADY HAVE AN EVENT SCHEDULED BEFORE THE NEXT INTERVAL?
	var kin;
	var timezone;

	var today = new Date();
	var newSchedule = {};
	for( var day in schedule ) {
		
		if( day === 'kin' ) {
			kin = schedule[day];
			continue;
		} else if( day === 'timezone' ) {
			timezone = schedule[day];
			continue;
		}

		var daySchedule = {};

		var onUTC = schedule[day].on_time_utc;
		var offUTC = schedule[day].off_time_utc;

		var onDate = new Date(onUTC);
		var offDate = new Date(offUTC);

		//if it is Daylight time, add an hour
		if( timezones[ timezone ] ) {
			onDate.setHours(onDate.getHours()-1);
			offDate.setHours(offDate.getHours()-1);
		}

		daySchedule.kin = schedule.kin;
		daySchedule.times = [];
		
		daySchedule.times.push({
			hour: onDate.getHours(),
			minutes: onDate.getMinutes(),
			turnOn: true,
			on_time_utc: onUTC
		});

		daySchedule.times.push({
			hour: offDate.getHours(),
			minutes: offDate.getMinutes(),
			turnOn: false,
			off_time_utc: offUTC
		});

		if(!newSchedule[day]) {
			newSchedule[day] = [];
		}
		newSchedule[day].push(daySchedule);

		//is the schedule for today?
		if(dayIsDayOfWeek(onDate, today) || dayIsDayOfWeek(offDate, today)) {
			//does this kin have events scheduled for this interval?
			if(upcomingIntervalsList.containsEventOfKin(daySchedule.kin)) {
				console.log('remove all of kin ', daySchedule.kin);
				upcomingIntervalsList.removeAllOfKin(daySchedule.kin);	
			}
			addEventsWithinTheHour(daySchedule);	
		}
	}

	allSchedules[schedule.kin] = newSchedule;

	console.log('schedule kin: ', schedule.kin)
	console.log('all schedules: ', allSchedules);

	updateScheduleInDatabase(newSchedule, kin, timezone);
	//Emit changes to sockets (KillSwitch GUIs should be updated immediately)
};

var updateScheduleInDatabase = function(newSchedule, kin, timezone) {
	//format for database
	var update = {};
	update.kin = kin;
	update.timezone = timezone;

  //monday_on_time: DataTypes.STRING,
  //monday_off_time: DataTypes.STRING,
	for( day in newSchedule ) {
		var daySchedule = newSchedule[day][0];
		console.log('newSchedule[day]: ', newSchedule[day]);
		console.log('update in DB: ', daySchedule);
		for( var i=0; i<daySchedule.times.length; i++ ) {
			if( daySchedule.times[i].on_time_utc ) {
				var key = day.toLowerCase() + '_on_time';
				update[key] = daySchedule.times[i].on_time_utc;
			} else {
				var key = day.toLowerCase() + '_off_time';
				update[key] = daySchedule.times[i].off_time_utc;
			}
		}
	}

  station_schedule.findOrCreate( { where: { kin: kin }, defaults: update } )
  .spread( function(station_schedule, created ) {
  	// if there is already a station_schedule for this kin, update it
  	if( !created ) {
  		station_schedule.update( update, { where: { kin: kin } } );
  	}
  });
};

//This is wrong some of the time, as it does not account for timezones
var dayIsDayOfWeek = function(date, today) {
  return date.getDay() === today.getDay();
};

var addEventsWithinTheHour = function(daySchedule) {
	//should either of the new events be completed during the current interval
	//if either of the above times is within now and nextIntervalBeginsAt, yes
	var now = new Date();
	for(var i=0; i<daySchedule.times.length; i++) {
		var time = daySchedule.times[i];

		console.log('scheduled time: ', time);
		console.log('server time: ', now);

		if((time.hour > now.getHours() || time.hour == now.getHours() && time.minutes >= now.getMinutes())
		 && (time.hour < nextIntervalBeginsAt.hour || 
		 time.hour === nextIntervalBeginsAt.hour && time.minutes < nextIntervalBeginsAt.minutes)) {

				//we should insert the event into the cache at the appropriate location
				var scheduledEvent = new ScheduledEvent(
					daySchedule.times[i].hour, 
					daySchedule.times[i].minutes,
					daySchedule.times[i].turnOn,
					daySchedule.kin);

				console.log('add event');

				upcomingIntervalsList.insert(scheduledEvent);
				
				// if scheduledEvent is the next event to occur
				// reset nextEventTimeout
				if(nextEventTimeout) {
					clearTimeout(nextEventTimeout);
				}
				var timeToEvent = getTimeToEvent(upcomingIntervalsList.head.scheduledEvent);
				nextEventTimeout = setTimeout(triggerSwitches, timeToEvent);
		}
	}
};

var gatherEventsWithinTheHour = function() {
	console.log('gatherEventsWithinTheHour');

	//LOCAL TIME!
	var now = new Date();
	var thisHour = now.getHours();
	var thisMinute = now.getMinutes();
	var dayOfWeekNumber = now.getDay();
	var timeString = thisHour + ':' + thisMinute;

	nextIntervalBeginsAt = {hour: thisHour+1, minutes: thisMinute};

	for(var kin in allSchedules) {
		var schedule = allSchedules[kin];
		console.log('schedule in allSchedules: ', schedule);

		var weekDay = datObjectNumberToDay[dayOfWeekNumber];
		if(!schedule[weekDay]) {
			continue;
		}
		
		var times = schedule[weekDay][0].times;
		for(var i=0; i<times.length; i++) {
			var time = times[i];
			console.log('time object: ', time);

			console.log('2: ', time.hour, ' == ', thisHour, ' &&: ', time.minutes, ' >= ', thisMinute);
			console.log('||: ', time.hour, ' == ', thisHour+1, ' && ', time.minutes, ' <= ', thisMinute);
			if((time.hour == thisHour && time.minutes >= thisMinute)
				|| (time.hour == thisHour+1 && time.minutes <= thisMinute)) {

				var scheduledEvent = new ScheduledEvent(time.hour, time.minutes, time.turnOn, schedule[weekDay][0].kin);
				console.log('Push scheduledEvent: ', scheduledEvent);
				eventsWithinTheHour.push(scheduledEvent);
			}
		}
	}

	//If there are any events scheduled in the next hour
	upcomingIntervalsList.addBulkAndSort(eventsWithinTheHour);
	if(upcomingIntervalsList.length > 0) {
		
		if(nextEventTimeout) {
			clearTimeout(nextEventTimeout);
		}
		var timeToEvent = getTimeToEvent(upcomingIntervalsList.head.scheduledEvent);
		nextEventTimeout = setTimeout(triggerSwitches, timeToEvent);
	}
};

var getTimeToEvent = function(scheduledEvent) {
	console.log('get time to event ', scheduledEvent);

	var now = new Date();
	var hourDifference = scheduledEvent.hour - now.getHours();
	var minuteDifference = scheduledEvent.minutes - now.getMinutes();

	var hourSeconds = 0;
	if(hourDifference > 0) {
		hourSeconds = hourDifference*60*60;
	}

	var minuteSeconds = minuteDifference*60;

	var totalSeconds = hourSeconds + minuteSeconds;
	return totalSeconds *1000; //milliseconds
};

var triggerSwitches = function() {
	console.log('Trigger switches');

	var currentEvent = upcomingIntervalsList.head.scheduledEvent;
	var timeToTriggerAt = {hour: currentEvent.hour, minutes: currentEvent.minutes};

	console.log( 'trigger switches for currentEvent: ', currentEvent );

	while(currentEvent && currentEvent.hour === timeToTriggerAt.hour && currentEvent.minutes === timeToTriggerAt.minutes) {
		//emit the switch command by kin
		// currentEvent.turnOn;
		// currentEvent.kin;

		if ( !io ) {
      var io = require( '../server' ).io;
    }

    //Emit only the station_status to killerPi to reduce bandwidth
    var onOff = currentEvent.turnOn ? 'On' : 'Off';
    io.sockets.emit( currentEvent.kin, { status: onOff } ); 
    console.log('emit to kin: ', currentEvent.kin, ' status: ', onOff);

    // io.sockets.emit( req.params.kin, { status: req.body.station_status } ); 

		console.log('triggerSwitches - removeHead from list');
		upcomingIntervalsList.removeHead();
		currentEvent = null;
		if(upcomingIntervalsList.head) {
			currentEvent = upcomingIntervalsList.head.scheduledEvent;
		}
	}

	// set the timer to wait for the next event
	if(currentEvent) {
		var timeToEvent = getTimeToEvent(currentEvent);
		setTimeout(triggerSwitches, timeToEvent);
	}
}

gatherEventsWithinTheHour();
var oneHourInMilliseconds = 60*60*1000;
setInterval(gatherEventsWithinTheHour, oneHourInMilliseconds);

module.exports = exports = {
	receivedOnOffSchedule: receivedOnOffSchedule
};



