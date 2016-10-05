var math   = require( '../helpers/math' );

module.exports = function( sequelize, DataTypes ) {
  var idle_chunk = sequelize.define('idle_chunk', {
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
  },
  {
    paranoid: true,
    underscored: true,
    classMethods: {
      start: function( reading ) {
        var newChunk = this.build({
          meter_serial_number: reading.meter_serial_number,
          mac_address: [],
          firmware: [],
          meter_model: [],

          start: new Date( reading.time_stamp_utc_ms ),
          end: new Date( reading.time_stamp_utc_ms ),
          kwh: Number( reading.kwh_tot ),

          min_volts_ln_1: reading.rms_volts_ln_1,
          max_volts_ln_1: reading.rms_volts_ln_1,
          min_volts_ln_2: reading.rms_volts_ln_2,
          max_volts_ln_2: reading.rms_volts_ln_2,

          min_power_factor_ln_1: reading.power_factor_ln_1,
          max_power_factor_ln_1: reading.power_factor_ln_1,
          min_power_factor_ln_2: reading.power_factor_ln_2,
          max_power_factor_ln_2: reading.power_factor_ln_2,
          station_id: reading.station_id,
          plug_id: reading.plug_id,
        });

        newChunk.macs = {};
        newChunk.firmwares = {};
        newChunk.meter_models = {};

        return newChunk;
      }
    },
    instanceMethods: {
      addNewReading: function( reading ) {
        this.macs[ reading.mac_address ] = true ;
        this.firmwares[ reading.firmware ] = true;
        this.meter_models[ reading.meter_model ] = true;
        reading.time_stamp_utc_ms = new Date( reading.time_stamp_utc_ms );
         // compare start date
        if ( reading.time_stamp_utc_ms < this.start ) {
          this.start = reading.time_stamp_utc_ms;
        }

        // compare end date
        if ( reading.time_stamp_utc_ms > this.end ) {
          this.end = reading.time_stamp_utc_ms;
        }

        this.min_volts_ln_1 = math.compareMin( this.min_volts_ln_1, reading.rms_volts_ln_1 );
        this.max_volts_ln_1 = math.compareMax( this.max_volts_ln_1, reading.rms_volts_ln_1 );
        this.min_volts_ln_2 = math.compareMin( this.min_volts_ln_2, reading.rms_volts_ln_2 );
        this.max_volts_ln_2 = math.compareMax( this.max_volts_ln_2, reading.rms_volts_ln_2 );

        this.min_power_factor_ln_1 = math.compareMin( this.min_power_factor_ln_1, reading.power_factor_ln_1 );
        this.max_power_factor_ln_1 = math.compareMax( this.max_power_factor_ln_1, reading.power_factor_ln_1 );
        this.min_power_factor_ln_2 = math.compareMin( this.min_power_factor_ln_2, reading.power_factor_ln_2 );
        this.max_power_factor_ln_2 = math.compareMax( this.max_power_factor_ln_2, reading.power_factor_ln_2 );
        return this;
      },
      stop: function() {
        this.mac_address = Object.keys( this.macs );
        this.changed( 'mac_address', true );
        delete this.macs;

        this.firmware = Object.keys( this.firmwares );
        this.changed( 'firmware', true );
        delete this.firmwares;

        this.meter_model = Object.keys( this.meter_models );
        this.changed( 'meter_model', true );
        delete this.meter_models;

        return this;
      }
    }
  });

    return idle_chunk;
    // plug_id, station_id
};
