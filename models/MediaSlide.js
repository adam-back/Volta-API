module.exports = function( sequelize, DataTypes ) {

	var media_slide = sequelize.define('media_slide', {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true
		},
		name: DataTypes.STRING,
		mediaUrl: DataTypes.STRING,
		active: DataTypes.BOOLEAN

	}, { paranoid: true, underscored: true } );

	return media_slide;

	//has the following methods:

	//media_slide.getMediaPresentations();
	//media_slide.setMediaPresentations();

	//media_slide.getMediaCampaigns();
	//media_slide.setMediaCampaigns();

};