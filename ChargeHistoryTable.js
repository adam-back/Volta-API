var ChargeHistory = sequelize.define('chargeHistory', {
	id: { 
		type:Sequelize.INTEGER,
		autoIncrement: true,
		primaryKey: true
	},
	userID: Sequelize.INTEGER,
	stationID: Sequelize.INTEGER,
	timeStart: Sequelize.DATE,
	timeStop: Sequelize.DATE,
	timeUnplugged: Sequelize.DATE,
	kWh: Sequelize.DECIMAL
});