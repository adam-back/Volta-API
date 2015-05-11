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
    ekm_push_mac: {
      type: DataTypes.STRING,
      unique: true
    },
    sim_card: {
      type: DataTypes.STRING,
      unique: true
    },
    location: DataTypes.STRING,
    location_address: DataTypes.STRING,
    location_gps: DataTypes.ARRAY( DataTypes.DECIMAL ),
    cost_to_access: DataTypes.BOOLEAN,
    cumulative_kwh: DataTypes.DECIMAL,
    station_status: DataTypes.STRING,
    // [ 'true', 'false', 'error' ], 1/3 stations in use, 1 plug broken
    in_use: DataTypes.ARRAY( DataTypes.STRING )
  }, { paranoid: true, underscored: true } );

  return station;

};
