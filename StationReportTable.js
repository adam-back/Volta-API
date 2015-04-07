var Sequelize = require('sequelize');
var sequelize = new Sequelize('database', 'username', 'password');

var Station = sequelize.define('Station', {
  id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    }, 
    // foreign key to station
  stationID: Sequelize.INTEGER,
  typeOfReport: Sequelize.STRING,
  timestamp: Sequelize.NOW,
  locationStamp: Sequelize.Array(Sequelize.DECIMAL),
  message: Sequelize.TEXT,
  picturePath: Sequelize.STRING 
});