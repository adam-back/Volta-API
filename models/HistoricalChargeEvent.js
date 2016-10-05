module.exports = function( sequelize, DataTypes ) {
	var historical_charge_event = sequelize.define('historical_charge_event', {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true
		},
		time_start: DataTypes.DATE,
		time_stop: DataTypes.DATE,
		time_unplugged: DataTypes.DATE,
		kwh: DataTypes.DECIMAL
	}, { paranoid: true, underscored: true } );

	return historical_charge_event;

	// user_id, station_id, plug_id, charge_event_month_summary_id added as foreign keys
};