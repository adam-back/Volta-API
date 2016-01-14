module.exports = function( sequelize, DataTypes ) {
  var station = sequelize.define('station', {
    id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true
      },
    kin: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    version: DataTypes.STRING,
    site_number: DataTypes.INTEGER,
    install_date: DataTypes.STRING,
    network: DataTypes.STRING,
    ekm_push_mac: DataTypes.STRING,
    sim_card: {
      type: DataTypes.STRING,
      unique: true
    },
    has_kill_switch: DataTypes.BOOLEAN,
    location: DataTypes.STRING,
    location_address: DataTypes.STRING,
    location_description: DataTypes.TEXT,
    location_gps: {
      type: DataTypes.ARRAY( DataTypes.DECIMAL ),
      defaultValue: null
    },
    cost_to_access: DataTypes.BOOLEAN,
    cumulative_kwh: DataTypes.DECIMAL,
    station_status: DataTypes.STRING,
    has_digital_front_display: DataTypes.BOOLEAN,
    // [ 'true', 'false', 'error' ], 1/3 stations in use, 1 plug broken
    in_use: DataTypes.ARRAY( DataTypes.STRING )
  }, { paranoid: true, underscored: true } );

  //has the following methods:

  //station.getMediaSchedule();
  //station.setMediaSchedule();

  //station.getMediaCampaigns();
  //station.setMediaCampaigns();

  //station.getAppSponsors();
  //station.setAppSponsors();

  return station;

};
