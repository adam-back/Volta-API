module.exports = function( sequelize, DataTypes ) {
  var weather_reading = sequelize.define('weather_reading', {
    id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true
      }, 
    outside_temperature: DataTypes.DECIMAL,
    internal_temperature: DataTypes.DECIMAL,
    relative_humidity: DataTypes.DECIMAL,
    barometric_pressure: DataTypes.DECIMAL
  });

  return weather_reading;

  // stationId added as foreign key
};