module.exports = function( sequelize, DataTypes ) {
	var StationRating = sequelize.define('StationRating', {
		id: { 
			type:DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true
		},
		rating: DataTypes.DECIMAL,
		message: DataTypes.TEXT,
		date: DataTypes.DATE
	});

	return StationRating;

	// stationId and userId added as foreign keys
};