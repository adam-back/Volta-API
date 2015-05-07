module.exports = function( sequelize, DataTypes ) {
	var ChargeEvent = sequelize.define('ChargeEvent', {
		id: { 
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true
		},
		timeStart: DataTypes.DATE,
		timeStop: DataTypes.DATE,
		timeUnplugged: DataTypes.DATE,
		kWh: DataTypes.DECIMAL
	});

	return ChargeEvent;

	// stationId and userId added as foreign keys
};