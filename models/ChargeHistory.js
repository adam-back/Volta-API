module.exports = function( sequelize, DataType ) {
	var ChargeHistory = sequelize.define('ChargeHistory', {
		id: { 
			type: DataType.INTEGER,
			autoIncrement: true,
			primaryKey: true
		},
		timeStart: DataType.DATE,
		timeStop: DataType.DATE,
		timeUnplugged: DataType.DATE,
		kWh: DataType.DECIMAL
	});

	return ChargeHistory;

	// stationId and userId added as foreign keys
};