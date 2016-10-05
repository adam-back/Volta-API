module.exports = function( sequelize, DataTypes ) {
  var ekm_reading = sequelize.define('ekm_reading', {
    id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true
        },
    meter_serial_number: DataTypes.STRING,
    group: DataTypes.INTEGER,
    interval: DataTypes.INTEGER,
    protocol: DataTypes.STRING,
    mac_address: DataTypes.STRING,
    date: DataTypes.STRING,
    time: DataTypes.STRING,
    time_stamp_utc_ms: DataTypes.DATE,
    firmware: DataTypes.STRING,
    // had to rename Model to meterModel
    // because it didn't like Model for import
    // even as a string
    meter_model: DataTypes.STRING,
    kwh_tot: DataTypes.STRING,
    kwh_tariff_1: DataTypes.STRING,
    kwh_tariff_2: DataTypes.STRING,
    kwh_tariff_3: DataTypes.STRING,
    kwh_tariff_4: DataTypes.STRING,
    rev_kwh_tot: DataTypes.STRING,
    rev_kwh_tariff_1: DataTypes.STRING,
    rev_kwh_tariff_2: DataTypes.STRING,
    rev_kwh_tariff_3: DataTypes.STRING,
    rev_kwh_tariff_4: DataTypes.STRING,
    rms_volts_ln_1: DataTypes.STRING,
    rms_volts_ln_2: DataTypes.STRING,
    rms_volts_ln_3: DataTypes.STRING,
    amps_ln_1: DataTypes.STRING,
    amps_ln_2: DataTypes.STRING,
    amps_ln_3: DataTypes.STRING,
    rms_watts_ln_1: DataTypes.STRING,
    rms_watts_ln_2: DataTypes.STRING,
    rms_watts_ln_3: DataTypes.STRING,
    rms_watts_tot: DataTypes.STRING,
    power_factor_ln_1: DataTypes.STRING,
    power_factor_ln_2: DataTypes.STRING,
    power_factor_ln_3: DataTypes.STRING,
    rms_watts_max_demand: DataTypes.STRING,
    max_demand_period: DataTypes.STRING,
    ct_ratio: DataTypes.STRING,
    pulse_cnt_1: DataTypes.STRING,
    pulse_cnt_2: DataTypes.STRING,
    pulse_cnt_3: DataTypes.STRING,
    pulse_ratio_1: DataTypes.STRING,
    pulse_ratio_2: DataTypes.STRING,
    pulse_ratio_3: DataTypes.STRING,
    state_inputs: DataTypes.STRING,
    reactive_energy_tot: DataTypes.STRING,
    kwh_rst: DataTypes.STRING,
    rev_kwh_rst: DataTypes.STRING,
    reactive_pwr_ln_1: DataTypes.STRING,
    reactive_pwr_ln_2: DataTypes.STRING,
    reactive_pwr_ln_3: DataTypes.STRING,
    reactive_pwr_tot: DataTypes.STRING,
    kwh_scale: DataTypes.STRING,
    line_freq: DataTypes.STRING,
    state_watts_dir: DataTypes.STRING,
    state_out: DataTypes.STRING,
    kwh_ln_1: DataTypes.STRING,
    kwh_ln_2: DataTypes.STRING,
    kwh_ln_3: DataTypes.STRING,
    rev_kwh_ln_1: DataTypes.STRING,
    rev_kwh_ln_2: DataTypes.STRING,
    rev_kwh_ln_3: DataTypes.STRING,
    cf_ratio: DataTypes.STRING
  },
  {
    underscored: true,
    classMethods: {
      formatAndBuildRaw: function( rawReading, plugId, stationId ) {
        var schema = {
          meter_serial_number: rawReading.Meter,
          group: rawReading.Group,
          interval: rawReading.Interval,
          protocol: rawReading.Protocol,
          mac_address: rawReading.MAC_Addr,
          date: rawReading.ReadData[ 0 ].Date,
          time: rawReading.ReadData[ 0 ].Time,
          time_stamp_utc_ms: rawReading.ReadData[ 0 ].Time_Stamp_UTC_ms,
          firmware: rawReading.ReadData[ 0 ].Firmware,
          // had to rename Model to meterModel
          // because it didn't like Model for import
          // even as a string
          meter_model: rawReading.ReadData[ 0 ].Model || null,
          kwh_tot: rawReading.ReadData[ 0 ].kWh_Tot,
          kwh_tariff_1: rawReading.ReadData[ 0 ].kWh_Tariff_1,
          kwh_tariff_2: rawReading.ReadData[ 0 ].kWh_Tariff_2,
          kwh_tariff_3: rawReading.ReadData[ 0 ].kWh_Tariff_3,
          kwh_tariff_4: rawReading.ReadData[ 0 ].kWh_Tariff_4,
          rev_kwh_tot: rawReading.ReadData[ 0 ].Rev_kWh_Tot,
          rev_kwh_tariff_1: rawReading.ReadData[ 0 ].Rev_kWh_Tariff_1,
          rev_kwh_tariff_2: rawReading.ReadData[ 0 ].Rev_kWh_Tariff_2,
          rev_kwh_tariff_3: rawReading.ReadData[ 0 ].Rev_kWh_Tariff_3,
          rev_kwh_tariff_4: rawReading.ReadData[ 0 ].Rev_kWh_Tariff_4,
          rms_volts_ln_1: rawReading.ReadData[ 0 ].RMS_Volts_Ln_1,
          rms_volts_ln_2: rawReading.ReadData[ 0 ].RMS_Volts_Ln_2,
          rms_volts_ln_3: rawReading.ReadData[ 0 ].RMS_Volts_Ln_3,
          amps_ln_1: rawReading.ReadData[ 0 ].Amps_Ln_1,
          amps_ln_2: rawReading.ReadData[ 0 ].Amps_Ln_2,
          amps_ln_3: rawReading.ReadData[ 0 ].Amps_Ln_3,
          rms_watts_ln_1: rawReading.ReadData[ 0 ].RMS_Watts_Ln_1,
          rms_watts_ln_2: rawReading.ReadData[ 0 ].RMS_Watts_Ln_2,
          rms_watts_ln_3: rawReading.ReadData[ 0 ].RMS_Watts_Ln_3,
          rms_watts_tot: rawReading.ReadData[ 0 ].RMS_Watts_Tot,
          power_factor_ln_1: rawReading.ReadData[ 0 ].Power_Factor_Ln_1,
          power_factor_ln_2: rawReading.ReadData[ 0 ].Power_Factor_Ln_2,
          power_factor_ln_3: rawReading.ReadData[ 0 ].Power_Factor_Ln_3,
          rms_watts_max_demand: rawReading.ReadData[ 0 ].RMS_Watts_Max_Demand,
          max_demand_period: rawReading.ReadData[ 0 ].Max_Demand_Period,
          ct_ratio: rawReading.ReadData[ 0 ].CT_Ratio,
          pulse_cnt_1: rawReading.ReadData[ 0 ].Pulse_Cnt_1,
          pulse_cnt_2: rawReading.ReadData[ 0 ].Pulse_Cnt_2,
          pulse_cnt_3: rawReading.ReadData[ 0 ].Pulse_Cnt_3,
          pulse_ratio_1: rawReading.ReadData[ 0 ].Pulse_Ratio_1,
          pulse_ratio_2: rawReading.ReadData[ 0 ].Pulse_Ratio_2,
          pulse_ratio_3: rawReading.ReadData[ 0 ].Pulse_Ratio_3,
          state_inputs: rawReading.ReadData[ 0 ].State_Inputs,
          reactive_energy_tot: rawReading.ReadData[ 0 ].Reactive_Energy_Tot,
          kwh_rst: rawReading.ReadData[ 0 ].kWh_Rst,
          rev_kwh_rst: rawReading.ReadData[ 0 ].Rev_kWh_Rst,
          reactive_pwr_ln_1: rawReading.ReadData[ 0 ].Reactive_Pwr_Ln_1,
          reactive_pwr_ln_2: rawReading.ReadData[ 0 ].Reactive_Pwr_Ln_2,
          reactive_pwr_ln_3: rawReading.ReadData[ 0 ].Reactive_Pwr_Ln_3,
          reactive_pwr_tot: rawReading.ReadData[ 0 ].Reactive_Pwr_Tot,
          kwh_scale: rawReading.ReadData[ 0 ].kWh_Scale,
          line_freq: rawReading.ReadData[ 0 ].Line_Freq,
          state_watts_dir: rawReading.ReadData[ 0 ].State_Watts_Dir,
          state_out: rawReading.ReadData[ 0 ].State_Out,
          kwh_ln_1: rawReading.ReadData[ 0 ].kWh_Ln_1,
          kwh_ln_2: rawReading.ReadData[ 0 ].kWh_Ln_2,
          kwh_ln_3: rawReading.ReadData[ 0 ].kWh_Ln_3,
          rev_kwh_ln_1: rawReading.ReadData[ 0 ].Rev_kWh_Ln_1,
          rev_kwh_ln_2: rawReading.ReadData[ 0 ].Rev_kWh_Ln_2,
          rev_kwh_ln_3: rawReading.ReadData[ 0 ].Rev_kWh_Ln_3,
          cf_ratio: rawReading.ReadData[ 0 ].CF_Ratio,
          plug_id: plugId || null,
          station_id: stationId || null
        };

        for ( var key in schema ) {
          if( schema[ key ] === undefined ) {
            schema[ key ] = null;
          }
        }

        return this.build( schema );
      }
    }
  });

    return ekm_reading;
    // plug_id, station_id, charge_event_id added as foreign keys
};
