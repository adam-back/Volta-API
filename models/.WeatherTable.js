var Sequelize = require('sequelize');
var sequelize = new Sequelize('database', 'username', 'password');

var Weather = sequelize.define('Weather', {
  id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    }, 
    // Foreign key to station
  stationID: Sequelize.INTEGER, 
  location: Sequelize.STRING,
  outsideTemperature: Sequelize.DECIMAL,
  internalTemperature: Sequelize.DECIMAL,
  relativeHumidity: Sequelize.DECIMAL,
  barometricPressure: Sequelize.DECIMAL
});