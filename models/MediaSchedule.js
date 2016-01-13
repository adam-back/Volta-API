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
		active: DataTypes.BOOLEAN

	}, { paranoid: true, underscored: true } );

	return media_schedule;

	//has station_id as a foreign key

	//has the following methods:

	//media_schedule.getMediaPresentations();
	//media_schedule.setMediaPresentations();

};