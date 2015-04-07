var StationRatings = sequelize.define('stationRatings', {
	id: { 
		type:Sequelize.INTEGER,
		autoIncrement: true,
		primaryKey: true
	},
	userID: Sequelize.INTEGER,
	stationID: Sequelize.INTEGER,
	rating: Sequelize.DECIMAL,
	message: Sequelize.TEXT,
	date: Sequelize.DATE
});