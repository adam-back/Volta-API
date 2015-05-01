module.exports = function( sequelize, DataTypes ) {
	var ChargeHistory = sequelize.define('ChargeHistory', {
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

	return ChargeHistory;

	// stationId and userId added as foreign keys
};