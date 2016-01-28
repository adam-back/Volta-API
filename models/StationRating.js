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
	}, { 'underscored': true } );

	return station_rating;

	// station_id and user_id added as foreign keys
};