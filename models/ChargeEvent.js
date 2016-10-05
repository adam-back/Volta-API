var moment = require( 'moment' );

module.exports = function( sequelize, DataTypes ) {
	var charge_event = sequelize.define('charge_event', {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true
		},
		time_start: DataTypes.DATE,
		time_stop: DataTypes.DATE,
		time_unplugged: DataTypes.DATE,
		kwh: {
			type: DataTypes.DECIMAL,
			validate: {
				min: 0,
				max: 100
			}
		}
	},
	{
		paranoid: true,
		underscored: true,
		classMethods: {
			start: function( reading ) {
				var newChargeEvent = this.build({
					time_start: moment.utc( reading.time_stamp_utc_ms ),
				  time_stop: null,
				  kwh: Number( reading.kwh_tot ),
				  station_id: reading.station_id,
				  plug_id: reading.plug_id,
				});

				// must add eager associations manually because there's no way to import ekm_readings
				// at the time charge_event is imported into sequelize
				newChargeEvent.readingIds = [];
				newChargeEvent.Ekm_readings = [];
				newChargeEvent.addNewReading( reading );
				return newChargeEvent;
			}
		},
		instanceMethods: {
			addNewReading: function( reading ) {
				if ( reading.id ) {
					this.readingIds.push( reading.id );
					delete reading.id;
				}
			  delete reading.charge_event_id;
			  delete reading.created_at;
			  delete reading.updated_at;
			  this.Ekm_readings.push( reading );
				return this;
			},
			stop: function() {
				var lastReading = this.Ekm_readings[ this.Ekm_readings.length - 1 ];
				var diff = Number( lastReading.kwh_tot ) - Number( this.kwh );
			  diff = Number( diff.toFixed( 1 ) ) ;
			  this.kwh = diff;
			  this.time_stop = moment.utc( lastReading.time_stamp_utc_ms );
			  return this;
			}
		}
	});

	return charge_event;
	// user_id, station_id, plug_id added as foreign keys
};
