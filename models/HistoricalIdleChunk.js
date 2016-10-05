module.exports = function( sequelize, DataTypes ) {
  var historical_idle_chunk = sequelize.define('historical_idle_chunk', {
    id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true
    },
    meter_serial_number: DataTypes.STRING,
    mac_address: {
      type: DataTypes.ARRAY( DataTypes.STRING ),
      allowNull: false,
      defaultValue: []
    },
    firmware: {
      type: DataTypes.ARRAY( DataTypes.STRING ),
      allowNull: false,
      defaultValue: []
    },
    // had to rename Model to meterModel
    // because it didn't like Model for import
    // even as a string
    meter_model: {
      type: DataTypes.ARRAY( DataTypes.STRING ),
      allowNull: false,
      defaultValue: []
    },

    start: DataTypes.DATE,
    end: DataTypes.DATE,

    kwh: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },

    min_volts_ln_1: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: 0
    },
    max_volts_ln_1: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: 0
    },
    min_volts_ln_2: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: 0
    },
    max_volts_ln_2: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: 0
    },

    min_power_factor_ln_1: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: 0
    },
    max_power_factor_ln_1: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: 0
    },
    min_power_factor_ln_2: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: 0
    },
    max_power_factor_ln_2: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: 0
    }
  }, { paranoid: true, underscored: true } );

    return historical_idle_chunk;

    // plug_id, station_id
};
