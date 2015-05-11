module.exports = function( sequelize, DataTypes ) {
  var plug = sequelize.define('plug', {
    id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true
    },
    number_on_station: DataTypes.INTEGER,
    // could be same as station install date,
    // but doesn't have to be if it was added later
    install_date: DataTypes.STRING,
    // RS1772 
    connector_type: DataTypes.STRING,
    // 1, Level 1
    charger_type: DataTypes.INTEGER,
    ekm_omnimeter_serial: {
      type: DataTypes.STRING,
      unique: true
    },
    meter_status: DataTypes.STRING,
    in_use: DataTypes.BOOLEAN,
    cumulative_kwh: DataTypes.DECIMAL
  }, { paranoid: true, underscored: true } );

  return plug;

  // station_id added as foreign key
};
