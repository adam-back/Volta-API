var Sequelize = require('sequelize');
var sequelize = new Sequelize('database', 'username', 'password');

var Station = sequelize.define('Station', {
  id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
  EKM: { Sequelize.JSON }, 
  kin: Sequelize.STRING
  location: Sequelize.STRING,
  locationAddress: Sequelize.STRING,
  locationGPS: Sequelize.Array(Sequelize.DECIMAL),
  chargeType: Sequelize.INTEGER,
  maxVolts: Sequelize.INTEGER,
  maxAmps: Sequelize.INTEGER,
  cumulativeKW: Sequelize.DECIMAL,
  status: Sequelize.STRING,
  inUse: Sequelize.BOOLEAN
});