var Sequelize = require('sequelize');
var sequelize = new Sequelize('database', 'username', 'password');

var EKMmeter = sequelize.define('EKMmeter', {
  id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    }, 
  "Start_Time_Stamp_UTC_ms": Sequelize.DATE,
  "End_Time_Stamp_UTC_ms": Sequelize.DATE,
  "Start_Date": Sequelize.DATE,
  "End_Date": Sequelize.DATE,
  "Meter": Sequelize.STRING,
  "Protocol": Sequelize.STRING,
  "Count": Sequelize.INTEGER,
  "kWh_Tot_DeltaMin": Sequelize.DECIMAL,
  "kWh_Tot_DeltaMax": Sequelize.DECIMAL,
  "kWh_Tot_Min": Sequelize.DECIMAL,
  "kWh_Tot_Max": Sequelize.DECIMAL,
  "kWh_Tot_Diff": Sequelize.DECIMAL,
  "kWh_Tariff_1_DeltaMin": Sequelize.DECIMAL,
  "kWh_Tariff_1_DeltaMax": Sequelize.DECIMAL,
  "kWh_Tariff_1_Min": Sequelize.DECIMAL,
  "kWh_Tariff_1_Max": Sequelize.DECIMAL,
  "kWh_Tariff_1_Diff": Sequelize.DECIMAL,
  "kWh_Tariff_2_DeltaMin": Sequelize.DECIMAL,
  "kWh_Tariff_2_DeltaMax": Sequelize.DECIMAL,
  "kWh_Tariff_2_Min": Sequelize.DECIMAL,
  "kWh_Tariff_2_Max": Sequelize.DECIMAL,
  "kWh_Tariff_2_Diff": Sequelize.DECIMAL,
  "kWh_Tariff_3_DeltaMin": Sequelize.DECIMAL,
  "kWh_Tariff_3_DeltaMax": Sequelize.DECIMAL,
  "kWh_Tariff_3_Min": Sequelize.DECIMAL,
  "kWh_Tariff_3_Max": Sequelize.DECIMAL,
  "kWh_Tariff_3_Diff": Sequelize.DECIMAL,
  "kWh_Tariff_4_DeltaMin": Sequelize.DECIMAL,
  "kWh_Tariff_4_DeltaMax": Sequelize.DECIMAL,
  "kWh_Tariff_4_Min": Sequelize.DECIMAL,
  "kWh_Tariff_4_Max": Sequelize.DECIMAL,
  "kWh_Tariff_4_Diff": Sequelize.DECIMAL,
  "Rev_kWh_Tot_DeltaMin": Sequelize.DECIMAL,
  "Rev_kWh_Tot_DeltaMax": Sequelize.DECIMAL,
  "Rev_kWh_Tot_Min": Sequelize.DECIMAL,
  "Rev_kWh_Tot_Max": Sequelize.DECIMAL,
  "Rev_kWh_Tot_Diff": Sequelize.DECIMAL,
  "Rev_kWh_Tariff_1_DeltaMin": Sequelize.DECIMAL,
  "Rev_kWh_Tariff_1_DeltaMax": Sequelize.DECIMAL,
  "Rev_kWh_Tariff_1_Min": Sequelize.DECIMAL,
  "Rev_kWh_Tariff_1_Max": Sequelize.DECIMAL,
  "Rev_kWh_Tariff_1_Diff": Sequelize.DECIMAL,
  "Rev_kWh_Tariff_2_DeltaMin": Sequelize.DECIMAL,
  "Rev_kWh_Tariff_2_DeltaMax": Sequelize.DECIMAL,
  "Rev_kWh_Tariff_2_Min": Sequelize.DECIMAL,
  "Rev_kWh_Tariff_2_Max": Sequelize.DECIMAL,
  "Rev_kWh_Tariff_2_Diff": Sequelize.DECIMAL,
  "Rev_kWh_Tariff_3_DeltaMin": Sequelize.DECIMAL,
  "Rev_kWh_Tariff_3_DeltaMax": Sequelize.DECIMAL,
  "Rev_kWh_Tariff_3_Min": Sequelize.DECIMAL,
  "Rev_kWh_Tariff_3_Max": Sequelize.DECIMAL,
  "Rev_kWh_Tariff_3_Diff": Sequelize.DECIMAL,
  "Rev_kWh_Tariff_4_DeltaMin": Sequelize.DECIMAL,
  "Rev_kWh_Tariff_4_DeltaMax": Sequelize.DECIMAL,
  "Rev_kWh_Tariff_4_Min": Sequelize.DECIMAL,
  "Rev_kWh_Tariff_4_Max": Sequelize.DECIMAL,
  "Rev_kWh_Tariff_4_Diff": Sequelize.DECIMAL,
  "RMS_Volts_Ln_1_Last": Sequelize.DECIMAL,
  "RMS_Volts_Ln_1_Average": Sequelize.DECIMAL,
  "RMS_Volts_Ln_1_StdDev": Sequelize.DECIMAL,
  "RMS_Volts_Ln_1_DeltaMin": Sequelize.DECIMAL,
  "RMS_Volts_Ln_1_DeltaMax": Sequelize.DECIMAL,
  "RMS_Volts_Ln_1_Min": Sequelize.DECIMAL,
  "RMS_Volts_Ln_1_Max": Sequelize.DECIMAL,
  "RMS_Volts_Ln_1_MinTime": Sequelize.DATE,
  "RMS_Volts_Ln_1_MaxTime": Sequelize.DATE,
  "RMS_Volts_Ln_2_Last": Sequelize.DECIMAL,
  "RMS_Volts_Ln_2_Average": Sequelize.DECIMAL,
  "RMS_Volts_Ln_2_StdDev": Sequelize.DECIMAL,
  "RMS_Volts_Ln_2_DeltaMin": Sequelize.DECIMAL,
  "RMS_Volts_Ln_2_DeltaMax": Sequelize.DECIMAL,
  "RMS_Volts_Ln_2_Min": Sequelize.DECIMAL,
  "RMS_Volts_Ln_2_Max": Sequelize.DECIMAL,
  "RMS_Volts_Ln_2_MinTime": Sequelize.DATE,
  "RMS_Volts_Ln_2_MaxTime": Sequelize.DATE,
  "RMS_Volts_Ln_3_Last": Sequelize.DECIMAL,
  "RMS_Volts_Ln_3_Average": Sequelize.DECIMAL,
  "RMS_Volts_Ln_3_StdDev": Sequelize.DECIMAL,
  "RMS_Volts_Ln_3_DeltaMin": Sequelize.DECIMAL,
  "RMS_Volts_Ln_3_DeltaMax": Sequelize.DECIMAL,
  "RMS_Volts_Ln_3_Min": Sequelize.DECIMAL,
  "RMS_Volts_Ln_3_Max": Sequelize.DECIMAL,
  "RMS_Volts_Ln_3_MinTime": Sequelize.DECIMAL,
  "RMS_Volts_Ln_3_MaxTime": Sequelize.DECIMAL,
  "Amps_Ln_1_Last": Sequelize.DECIMAL,
  "Amps_Ln_1_Average": Sequelize.DECIMAL,
  "Amps_Ln_1_StdDev": Sequelize.DECIMAL,
  "Amps_Ln_1_DeltaMin": Sequelize.DECIMAL,
  "Amps_Ln_1_DeltaMax": Sequelize.DECIMAL,
  "Amps_Ln_1_Min": Sequelize.DECIMAL,
  "Amps_Ln_1_Max": Sequelize.DECIMAL,
  "Amps_Ln_1_MinTime": Sequelize.DATE,
  "Amps_Ln_1_MaxTime": Sequelize.DATE,
  "Amps_Ln_2_Last": Sequelize.DECIMAL,
  "Amps_Ln_2_Average": Sequelize.DECIMAL,
  "Amps_Ln_2_StdDev": Sequelize.DECIMAL,
  "Amps_Ln_2_DeltaMin": Sequelize.DECIMAL,
  "Amps_Ln_2_DeltaMax": Sequelize.DECIMAL,
  "Amps_Ln_2_Min": Sequelize.DECIMAL,
  "Amps_Ln_2_Max": Sequelize.DECIMAL,
  "Amps_Ln_2_MinTime": Sequelize.DATE,
  "Amps_Ln_2_MaxTime": Sequelize.DATE,
  "Amps_Ln_3_Last": Sequelize.DECIMAL,
  "Amps_Ln_3_Average": Sequelize.DECIMAL,
  "Amps_Ln_3_StdDev": Sequelize.DECIMAL,
  "Amps_Ln_3_DeltaMin": Sequelize.DECIMAL,
  "Amps_Ln_3_DeltaMax": Sequelize.DECIMAL,
  "Amps_Ln_3_Min": Sequelize.DECIMAL,
  "Amps_Ln_3_Max": Sequelize.DECIMAL,
  "Amps_Ln_3_MinTime": Sequelize.DECIMAL,
  "Amps_Ln_3_MaxTime": Sequelize.DECIMAL,
  "RMS_Watts_Ln_1_Last": Sequelize.DECIMAL,
  "RMS_Watts_Ln_1_Average": Sequelize.DECIMAL,
  "RMS_Watts_Ln_1_StdDev": Sequelize.DECIMAL,
  "RMS_Watts_Ln_1_DeltaMin": Sequelize.DECIMAL,
  "RMS_Watts_Ln_1_DeltaMax": Sequelize.DECIMAL,
  "RMS_Watts_Ln_1_Min": Sequelize.DECIMAL,
  "RMS_Watts_Ln_1_Max": Sequelize.DECIMAL,
  "RMS_Watts_Ln_1_MinTime": Sequelize.DATE,
  "RMS_Watts_Ln_1_MaxTime": Sequelize.DATE,
  "RMS_Watts_Ln_2_Last": Sequelize.DECIMAL,
  "RMS_Watts_Ln_2_Average": Sequelize.DECIMAL,
  "RMS_Watts_Ln_2_StdDev": Sequelize.DECIMAL,
  "RMS_Watts_Ln_2_DeltaMin": Sequelize.DECIMAL,
  "RMS_Watts_Ln_2_DeltaMax": Sequelize.DECIMAL,
  "RMS_Watts_Ln_2_Min": Sequelize.DECIMAL,
  "RMS_Watts_Ln_2_Max": Sequelize.DECIMAL,
  "RMS_Watts_Ln_2_MinTime": Sequelize.DATE,
  "RMS_Watts_Ln_2_MaxTime": Sequelize.DATE,
  "RMS_Watts_Ln_3_Last": Sequelize.DECIMAL,
  "RMS_Watts_Ln_3_Average": Sequelize.DECIMAL,
  "RMS_Watts_Ln_3_StdDev": Sequelize.DECIMAL,
  "RMS_Watts_Ln_3_DeltaMin": Sequelize.DECIMAL,
  "RMS_Watts_Ln_3_DeltaMax": Sequelize.DECIMAL,
  "RMS_Watts_Ln_3_Min": Sequelize.DECIMAL,
  "RMS_Watts_Ln_3_Max": Sequelize.DECIMAL,
  "RMS_Watts_Ln_3_MinTime": Sequelize.DECIMAL,
  "RMS_Watts_Ln_3_MaxTime": Sequelize.DECIMAL,
  "RMS_Watts_Tot_Last": Sequelize.DECIMAL,
  "RMS_Watts_Tot_Average": Sequelize.DECIMAL,
  "RMS_Watts_Tot_StdDev": Sequelize.DECIMAL,
  "RMS_Watts_Tot_DeltaMin": Sequelize.DECIMAL,
  "RMS_Watts_Tot_DeltaMax": Sequelize.DECIMAL,
  "RMS_Watts_Tot_Min": Sequelize.DECIMAL,
  "RMS_Watts_Tot_Max": 227Sequelize.DECIMAL,
  "RMS_Watts_Tot_MinTime": Sequelize.DATE,
  "RMS_Watts_Tot_MaxTime": Sequelize.DATE,
  "Power_Factor_Ln_1_Last": Sequelize.STRING,
  "Power_Factor_Ln_1_Average": Sequelize.STRING,
  "Power_Factor_Ln_1_StdDev": Sequelize.DECIMAL,
  "Power_Factor_Ln_1_DeltaMin": Sequelize.DECIMAL,
  "Power_Factor_Ln_1_DeltaMax": Sequelize.DECIMAL,
  "Power_Factor_Ln_1_MaxTime": Sequelize.DATE,
  "Power_Factor_Ln_2_Last": Sequelize.STRING,
  "Power_Factor_Ln_2_Average": Sequelize.STRING,
  "Power_Factor_Ln_2_StdDev": Sequelize.DECIMAL,
  "Power_Factor_Ln_2_DeltaMin": Sequelize.DECIMAL,
  "Power_Factor_Ln_2_DeltaMax": Sequelize.DECIMAL,
  "Power_Factor_Ln_2_MaxTime": Sequelize.DATE,
  "Power_Factor_Ln_3_Last": Sequelize.STRING,
  "Power_Factor_Ln_3_Average": Sequelize.STRING,
  "Power_Factor_Ln_3_StdDev": Sequelize.DECIMAL,
  "Power_Factor_Ln_3_DeltaMin": Sequelize.DECIMAL,
  "Power_Factor_Ln_3_DeltaMax": Sequelize.DECIMAL,
  "Power_Factor_Ln_3_MaxTime": Sequelize.DATE,
  "RMS_Watts_Max_Demand_Last": Sequelize.DECIMAL,
  "RMS_Watts_Max_Demand_DeltaMin": Sequelize.DECIMAL,
  "RMS_Watts_Max_Demand_DeltaMax": Sequelize.DECIMAL,
  "RMS_Watts_Max_Demand_Min": Sequelize.DECIMAL,
  "RMS_Watts_Max_Demand_Max": Sequelize.DECIMAL,
  "RMS_Watts_Max_Demand_MinTime": Sequelize.DATE,
  "RMS_Watts_Max_Demand_MaxTime": Sequelize.DATE,
  "RMS_Watts_Max_Demand_Diff": Sequelize.DECIMAL,
  "CT_Ratio_Last": Sequelize.DECIMAL,
  "CT_Ratio_Average": Sequelize.DECIMAL,
  "CT_Ratio_Diff": Sequelize.DECIMAL,
  "Pulse_Cnt_1_Last": Sequelize.DECIMAL,
  "Pulse_Cnt_1_Average": Sequelize.DECIMAL,
  "Pulse_Cnt_1_StdDev": Sequelize.DECIMAL,
  "Pulse_Cnt_1_DeltaMin": Sequelize.DECIMAL,
  "Pulse_Cnt_1_DeltaMax": Sequelize.DECIMAL,
  "Pulse_Cnt_1_Max": Sequelize.DECIMAL,
  "Pulse_Cnt_1_Diff": Sequelize.DECIMAL,
  "Pulse_Cnt_2_Last": Sequelize.DECIMAL,
  "Pulse_Cnt_2_Average": Sequelize.DECIMAL,
  "Pulse_Cnt_2_StdDev": Sequelize.DECIMAL,
  "Pulse_Cnt_2_DeltaMin": Sequelize.DECIMAL,
  "Pulse_Cnt_2_DeltaMax": Sequelize.DECIMAL,
  "Pulse_Cnt_2_Max": Sequelize.DECIMAL,
  "Pulse_Cnt_2_Diff": Sequelize.DECIMAL,
  "Pulse_Cnt_3_Last": Sequelize.DECIMAL,
  "Pulse_Cnt_3_Average": Sequelize.DECIMAL,
  "Pulse_Cnt_3_StdDev": Sequelize.DECIMAL,
  "Pulse_Cnt_3_DeltaMin": Sequelize.DECIMAL,
  "Pulse_Cnt_3_DeltaMax": Sequelize.DECIMAL,
  "Pulse_Cnt_3_Max": Sequelize.DECIMAL,
  "Pulse_Cnt_3_Diff": Sequelize.DECIMAL,
  "Pulse_Ratio_1_Last": Sequelize.DECIMAL,
  "Pulse_Ratio_1_Average": Sequelize.DECIMAL,
  "Pulse_Ratio_1_Diff": Sequelize.DECIMAL,
  "Pulse_Ratio_2_Last": Sequelize.DECIMAL,
  "Pulse_Ratio_2_Average": Sequelize.DECIMAL,
  "Pulse_Ratio_2_Diff": Sequelize.DECIMAL,
  "Pulse_Ratio_3_Last": Sequelize.DECIMAL,
  "Pulse_Ratio_3_Average": Sequelize.DECIMAL,
  "Pulse_Ratio_3_Diff": Sequelize.DECIMAL,
  "Reactive_Energy_Tot_Last": Sequelize.DECIMAL,,
  "Reactive_Energy_Tot_DeltaMin": Sequelize.DECIMAL,
  "Reactive_Energy_Tot_DeltaMax": Sequelize.DECIMAL,
  "Reactive_Energy_Tot_Min": Sequelize.DECIMAL,
  "Reactive_Energy_Tot_Max": Sequelize.DECIMAL,
  "Reactive_Energy_Tot_MaxTime": Sequelize.DATE,
  "Reactive_Energy_Tot_Diff": Sequelize.DECIMAL,
  "kWh_Rst_DeltaMin": Sequelize.DECIMAL,
  "kWh_Rst_DeltaMax": Sequelize.DECIMAL,
  "kWh_Rst_Min": Sequelize.DECIMAL,
  "kWh_Rst_Max": Sequelize.DECIMAL,
  "kWh_Rst_Diff": Sequelize.DECIMAL,
  "Rev_kWh_Rst_DeltaMin": Sequelize.DECIMAL,
  "Rev_kWh_Rst_DeltaMax": Sequelize.DECIMAL,
  "Rev_kWh_Rst_Min": Sequelize.DECIMAL,
  "Rev_kWh_Rst_Max": Sequelize.DECIMAL,
  "Rev_kWh_Rst_Diff": Sequelize.DECIMAL,
  "Reactive_Pwr_Ln_1_Last": Sequelize.DECIMAL,
  "Reactive_Pwr_Ln_1_Average": Sequelize.DECIMAL,
  "Reactive_Pwr_Ln_1_StdDev": Sequelize.DECIMAL,
  "Reactive_Pwr_Ln_1_DeltaMin": Sequelize.DECIMAL,
  "Reactive_Pwr_Ln_1_DeltaMax": Sequelize.DECIMAL,
  "Reactive_Pwr_Ln_1_Min": Sequelize.DECIMAL,
  "Reactive_Pwr_Ln_1_Max": Sequelize.DECIMAL,
  "Reactive_Pwr_Ln_1_MaxTime": Sequelize.DATE,
  "Reactive_Pwr_Ln_2_Last": Sequelize.DECIMAL,
  "Reactive_Pwr_Ln_2_Average": Sequelize.DECIMAL,
  "Reactive_Pwr_Ln_2_StdDev": Sequelize.DECIMAL,
  "Reactive_Pwr_Ln_2_DeltaMin": Sequelize.DECIMAL,
  "Reactive_Pwr_Ln_2_DeltaMax": Sequelize.DECIMAL,
  "Reactive_Pwr_Ln_2_Min": Sequelize.DECIMAL,
  "Reactive_Pwr_Ln_2_Max": Sequelize.DECIMAL,
  "Reactive_Pwr_Ln_2_MaxTime": Sequelize.DATE,
  "Reactive_Pwr_Ln_3_Last": Sequelize.DECIMAL,
  "Reactive_Pwr_Ln_3_Average": Sequelize.DECIMAL,
  "Reactive_Pwr_Ln_3_StdDev": Sequelize.DECIMAL,
  "Reactive_Pwr_Ln_3_DeltaMin": Sequelize.DECIMAL,
  "Reactive_Pwr_Ln_3_DeltaMax": Sequelize.DECIMAL,
  "Reactive_Pwr_Ln_3_Min": Sequelize.DECIMAL,
  "Reactive_Pwr_Ln_3_Max": Sequelize.DECIMAL,
  "Reactive_Pwr_Ln_3_MaxTime": Sequelize.DECIMAL,
  "Reactive_Pwr_Tot_Last": Sequelize.DECIMAL,
  "Reactive_Pwr_Tot_Average": Sequelize.DECIMAL,
  "Reactive_Pwr_Tot_StdDev": Sequelize.DECIMAL,
  "Reactive_Pwr_Tot_DeltaMin": Sequelize.DECIMAL,
  "Reactive_Pwr_Tot_DeltaMax": Sequelize.DECIMAL,
  "Reactive_Pwr_Tot_Min": Sequelize.DECIMAL,
  "Reactive_Pwr_Tot_Max": Sequelize.DECIMAL,
  "Reactive_Pwr_Tot_MaxTime": Sequelize.DATE,
  "Line_Freq_Last": Sequelize.DECIMAL,
  "Line_Freq_Average": Sequelize.DECIMAL,
  "Line_Freq_StdDev": Sequelize.DECIMAL,
  "Line_Freq_DeltaMin": Sequelize.DECIMAL,
  "Line_Freq_DeltaMax": Sequelize.DECIMAL,
  "Line_Freq_Min": Sequelize.DECIMAL,
  "Line_Freq_Max": Sequelize.DECIMAL,
  "Line_Freq_MinTime": Sequelize.DATE,
  "Line_Freq_MaxTime": Sequelize.DATE,
  "kWh_Ln_1_DeltaMin": Sequelize.DECIMAL,
  "kWh_Ln_1_DeltaMax": Sequelize.DECIMAL,
  "kWh_Ln_1_Min": Sequelize.DECIMAL,
  "kWh_Ln_1_Max": Sequelize.DECIMAL,
  "kWh_Ln_1_Diff": Sequelize.DECIMAL,
  "kWh_Ln_2_DeltaMin": Sequelize.DECIMAL,
  "kWh_Ln_2_DeltaMax": Sequelize.DECIMAL,
  "kWh_Ln_2_Min": Sequelize.DECIMAL,
  "kWh_Ln_2_Max": Sequelize.DECIMAL,
  "kWh_Ln_2_Diff": Sequelize.DECIMAL,
  "kWh_Ln_3_DeltaMin": Sequelize.DECIMAL,
  "kWh_Ln_3_DeltaMax": Sequelize.DECIMAL,
  "kWh_Ln_3_Min": Sequelize.DECIMAL,
  "kWh_Ln_3_Max": Sequelize.DECIMAL,
  "kWh_Ln_3_Diff": Sequelize.DECIMAL,
  "Rev_kWh_Ln_1_DeltaMin": Sequelize.DECIMAL,
  "Rev_kWh_Ln_1_DeltaMax": Sequelize.DECIMAL,
  "Rev_kWh_Ln_1_Min": Sequelize.DECIMAL,
  "Rev_kWh_Ln_1_Max": Sequelize.DECIMAL,
  "Rev_kWh_Ln_1_Diff": Sequelize.DECIMAL,
  "Rev_kWh_Ln_2_DeltaMin": Sequelize.DECIMAL,
  "Rev_kWh_Ln_2_DeltaMax": Sequelize.DECIMAL,
  "Rev_kWh_Ln_2_Min": Sequelize.DECIMAL,
  "Rev_kWh_Ln_2_Max": Sequelize.DECIMAL,
  "Rev_kWh_Ln_2_Diff": Sequelize.DECIMAL,
  "Rev_kWh_Ln_3_DeltaMin": Sequelize.DECIMAL,
  "Rev_kWh_Ln_3_DeltaMax": Sequelize.DECIMAL,
  "Rev_kWh_Ln_3_Min": Sequelize.DECIMAL,
  "Rev_kWh_Ln_3_Max": Sequelize.DECIMAL,
  "Rev_kWh_Ln_3_Diff": Sequelize.DECIMAL,
  "Max_Demand_Rst_Last": Sequelize.DECIMAL,
  "Max_Demand_Rst_MaxTime": Sequelize.DECIMAL,
  "Max_Demand_Rst_Diff": Sequelize.DECIMAL,
  "CF_Ratio_Last": 80Sequelize.DECIMAL,
  "CF_Ratio_Average": 80Sequelize.DECIMAL,
  "CF_Ratio_Diff": Sequelize.DECIMAL,
  "Power_Factor_Ln_1_RangeFrom": Sequelize.STRING,
  "Power_Factor_Ln_1_RangeTo": Sequelize.STRING,
  "Power_Factor_Ln_2_RangeFrom": Sequelize.STRING,
  "Power_Factor_Ln_2_RangeTo": Sequelize.STRING,
  "Power_Factor_Ln_3_RangeFrom": Sequelize.STRING,
  "Power_Factor_Ln_3_RangeTo": Sequelize.STRING
});