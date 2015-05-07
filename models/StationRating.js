module.exports = function( sequelize, DataTypes ) {
	var station_rating = sequelize.define('station_rating', {
		id: { 
			type:DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true
		},
		rating: DataTypes.DECIMAL,
		message: DataTypes.TEXT,
		date: DataTypes.DATE
	});

	return station_rating;

	// stationId and userId added as foreign keys
};