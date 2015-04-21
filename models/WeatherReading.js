module.exports = function( sequelize, DataTypes ) {
  var WeatherReading = sequelize.define('WeatherReading', {
    id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true
      }, 
    outsideTemperature: DataTypes.DECIMAL,
    internalTemperature: DataTypes.DECIMAL,
    relativeHumidity: DataTypes.DECIMAL,
    barometricPressure: DataTypes.DECIMAL
  });

  return WeatherReading;

  // stationId added as foreign key
};