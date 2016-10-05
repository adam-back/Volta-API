exports.compareMin = function( existingValue, newValue ) {
  existingValue = Number( existingValue );
  newValue = Number( newValue );

  if ( existingValue < newValue ) {
    return existingValue;
  } else {
    return newValue;
  }
};

exports.compareMax = function( existingValue, newValue ) {
  existingValue = Number( existingValue );
  newValue = Number( newValue );

  if ( existingValue > newValue ) {
    return existingValue;
  } else {
    return newValue;
  }
};

exports.roundSummaryKwh = function( summary ) {
  // round all decimals to the nearest 10th
  summary.kwh_start = Number( Number( summary.kwh_start ).toFixed( 1 ) );
  summary.kwh_end = Number( Number( summary.kwh_end ).toFixed( 1 ) );
  summary.kwh_diff = Number( Number( summary.kwh_diff ).toFixed( 1 ) );

  summary.min_volts_ln_1 = Number( Number( summary.min_volts_ln_1 ).toFixed( 1 ) );
  summary.max_volts_ln_1 = Number( Number( summary.max_volts_ln_1 ).toFixed( 1 ) );
  summary.min_volts_ln_2 = Number( Number( summary.min_volts_ln_2 ).toFixed( 1 ) );
  summary.max_volts_ln_2 = Number( Number( summary.max_volts_ln_2 ).toFixed( 1 ) );

  summary.min_amps_ln_1 = Number( Number( summary.min_amps_ln_1 ).toFixed( 1 ) );
  summary.max_amps_ln_1 = Number( Number( summary.max_amps_ln_1 ).toFixed( 1 ) );
  summary.min_amps_ln_2 = Number( Number( summary.min_amps_ln_2 ).toFixed( 1 ) );
  summary.max_amps_ln_2 = Number( Number( summary.max_amps_ln_2 ).toFixed( 1 ) );

  summary.min_power_factor_ln_1 = Number( summary.min_power_factor_ln_1.toFixed( 1 ) );
  summary.max_power_factor_ln_1 = Number( summary.max_power_factor_ln_1.toFixed( 1 ) );
  summary.min_power_factor_ln_2 = Number( summary.min_power_factor_ln_2.toFixed( 1 ) );
  summary.max_power_factor_ln_2 = Number( summary.max_power_factor_ln_2.toFixed( 1 ) );

  return summary;
};