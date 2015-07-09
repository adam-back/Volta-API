//NEED TO BE SENT AN ENTIRE SCHEDULE NOT JUST DELTAS!
var UpcomingEventsListExports = require( './UpcomingEventList' );
var UpcomingEventsList = UpcomingEventsListExports.UpcomingEventsList;
var ScheduledEvent = UpcomingEventsListExports.ScheduledEvent;

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

var allSchedules = {};
var nextIntervalBeginsAt;

//receivedOnOffSchedule({'Monday':{on_time_utc:new Date().toUTCString(), off_time_utc:new Date().toUTCString()}});
//{ Monday: {off_time_utc, on_time_utc} }
var receivedOnOffSchedule = function(schedule) {

	console.log('receivedOnOffSchedule: ', schedule);

	//PERFORM TWO CHECKS
	//WILL EITHER OF THE NEW EVENTS (ON/OFF) OCCUR BEFORE THE NEXT INTERVAL?
	//DOES THIS KIN ALREADY HAVE AN EVENT SCHEDULED BEFORE THE NEXT INTERVAL?
	console.log(schedule);

	var newSchedule = {};
	for(var day in schedule) {
		if(day === 'kin') {
			continue;
		}
		var daySchedule = {};

		var onUTC = schedule[day].on_time_utc;
		var offUTC = schedule[day].off_time_utc;

		var onDate = new Date(onUTC);
		var offDate = new Date(offUTC);

		daySchedule.kin = schedule.kin;
		daySchedule.times = [];
		
		daySchedule.times.push({
			hour: onDate.getHours(),
			minutes: onDate.getMinutes(),
			turnOn: true
		});

		daySchedule.times.push({
			hour: offDate.getHours(),
			minutes: offDate.getMinutes(),
			turnOn: false
		});

		if(!newSchedule[day]) {
			newSchedule[day] = [];
		}
		newSchedule[day].push(daySchedule);

		//does this kin have events scheduled for this interval?
		//if so, delete them
		if(upcomingIntervalsList.containsEventOfKin(daySchedule.kin)) {
			console.log('remove all of kin ', daySchedule.kin);
			upcomingIntervalsList.removeAllOfKin(daySchedule.kin);
		}
		console.log('should complete removing stuff before hitting here');

		//should either of the new events be completed during the current interval
		//if either of the above times is within now and nextIntervalBeginsAt, yes
		var now = new Date();
		for(var i=0; i<daySchedule.times.length; i++) {
			var time = daySchedule.times[i];

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
					var timeToEvent = getTimeToEvent(upcomingIntervalsList.head.scheduledEvent);
					nextEventTimeout = setTimeout(triggerSwitches, timeToEvent);
			}
		}
	}

	allSchedules[schedule.kin] = newSchedule;

	//Add to DB?
	//Emit changes to sockets (KillSwitch GUIs should be updated immediately)
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

	for(var schedule in allSchedules) {
		for(var time in schedule.times) {

			if(dayToNumber[schedule.day] == dayOfWeekNumber) {
				if((time.hour == thisHour && time.minutes >= thisMinute)
					|| (time.hour == thisHour+1 && time.minutes <= thisMinute)) {

					var scheduledEvent = new ScheduledEvent(time.hour, time.minutes, time.turnOn, schedule.kin);
					eventsWithinTheHour.push(scheduledEvent);
				}
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
    io.sockets.emit( currentEvent.kin, { status:  onOff} ); 

		console.log('triggerSwitches - removeHead from list');
		upcomingIntervalsList.removeHead();
		currentEvent = null;
		if(upcomingIntervalsList.head) {
			currentEvent = upcomingIntervalsList.head.scheduledEvent;
		}
	}

	// set the timer to wait for the next event
	if(currentEvent) {
		var timeToEvent = getTimeToEvent(upcomingIntervalsList.head.scheduledEvent);
		setTimeout(triggerSwitches, timeToEvent);
	}
}

gatherEventsWithinTheHour();
var oneHourInMilliseconds = 60*60*1000;
setInterval(gatherEventsWithinTheHour, oneHourInMilliseconds);

module.exports = exports = {
	receivedOnOffSchedule: receivedOnOffSchedule
};

