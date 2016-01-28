module.exports = function( sequelize, DataTypes ) {

	//create another row each time a schedule is changed
	var media_campaign = sequelize.define('media_campaign', {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true
		},

		startDate: DataTypes.DATE,
		endDate: DataTypes.DATE

	}, { paranoid: true, underscored: true } );

	return media_campaign;

	//has media_company as a forign key

	//has the following methods:

	//media_campaign.getStations();
	//media_campaign.setStations();

	//media_campaign.getMediaSlides();
	//media_campaign.setMediaSlides();

};

/* GET ALL TIMES THAT EACH SLIDE RAN */

//slides --> presentations --> schedules ( --> kiosks )

//since we are repeating this process for each slide and their are N flips,
//  we know that this slide ran for 1/N of the time the presentation was shown

//schedule knows how long the presentation was shown and at what times
// --> after gathering how long each slide ran for



/* GET ALL TIMES THAT SLIDES ARE CURRENTLY RUNNING */

//kiosks --> schedule --> presentations --> slides






