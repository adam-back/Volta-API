module.exports = function( sequelize, DataTypes ) {
	var app_sponsor = sequelize.define('app_sponsor', {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true
		},
		company: DataTypes.STRING,
		networks: DataTypes.ARRAY( DataTypes.STRING ),
		website_url: DataTypes.TEXT,
		twitter_url: DataTypes.TEXT,
		facebook_url: DataTypes.TEXT,
		instagram_url: DataTypes.TEXT,
		logo_url: DataTypes.TEXT,
		station_query: DataTypes.JSON,
		banner_url: DataTypes.TEXT,
		start: DataTypes.DATE,
		end: DataTypes.DATE,
		current: DataTypes.BOOLEAN
	}, { underscored: true } );

	return app_sponsor;

	// foreign key to create join table with stations
};