module.exports = function( sequelize, DataTypes ) {

	var media_schedule = sequelize.define('media_schedule', {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true
		},
		schedule: DataTypes.STRING,
		kin: DataTypes.STRING,
		serial_number: DataTypes.STRING,
		active: DataTypes.BOOLEAN,
		last_check_in: DataTypes.DATE,
		downloaded_presentations: DataTypes.ARRAY( DataTypes.INTEGER ),
		slides_played_recently: DataTypes.ARRAY( DataTypes.INTEGER ),
		slides_not_played_recently: DataTypes.ARRAY( DataTypes.INTEGER ),
		playing_presentation: DataTypes.INTEGER
	}, { paranoid: true, underscored: true } );

	return media_schedule;

	//has station_id as a foreign key

	//has the following methods:

	//media_schedule.getMediaPresentations();
	//media_schedule.setMediaPresentations();

};
