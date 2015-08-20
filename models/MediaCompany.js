module.exports = function( sequelize, DataTypes ) {
	
	//create another row each time a schedule is changed
	var media_company = sequelize.define('media_company', {
		id: { 
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true
		},
		name: DataTypes.STRING

	}, { underscored: true } );

	return media_company;

	//has the following methods:
	
	//media_company.getMediaCampaigns()
	//media_company.setMediaCampaigns()

};