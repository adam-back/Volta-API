var math = require( '../factories/math' );

module.exports = function( sequelize, DataTypes ) {
  var ekm_reading_hour_summary = sequelize.define('ekm_reading_hour_summary', {
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

    // February 21, 2015, 0
    hour: DataTypes.STRING,
    start: DataTypes.DATE,
    end: DataTypes.DATE,

    firstReading: DataTypes.DATE,
    lastReading: DataTypes.DATE,

    kwh_start: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: 0
    },
    kwh_end: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: 0
    },
    kwh_diff: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: 0
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

    min_amps_ln_1: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: 0
    },
    max_amps_ln_1: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: 0
    },
    min_amps_ln_2: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: 0
    },
    max_amps_ln_2: {
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
  }, {
    paranoid: true,
    underscored: true,
    hooks: {
      beforeUpdate: function( summary, options ) {
        math.roundSummaryKwh( summary );
      },
      beforeCreate: function( summary, options ) {
        math.roundSummaryKwh( summary );
      }
    }
  });

    return ekm_reading_hour_summary;

    // foreign keys
    // plug_id, station_id, ekm_reading_day_summary_id
};