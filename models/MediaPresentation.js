module.exports = function( sequelize, DataTypes ) {

	var media_presentation = sequelize.define('media_presentation', {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true
		},
		name: DataTypes.STRING,
		active: DataTypes.BOOLEAN,
		slide_order: DataTypes.ARRAY( DataTypes.INTEGER )
	}, { paranoid: true, underscored: true } );

	return media_presentation;

	//has the following methods:

	//media_presentation.getMediaSlides();
	//media_presentation.setMediaSlides();

	//media_presentation.getMediaSchedules();
	//media_presentation.setMediaSchedules();
};