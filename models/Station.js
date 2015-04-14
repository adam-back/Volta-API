module.exports = function( sequelize, DataTypes ) {
  var Station = sequelize.define('Station', {
    id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true
      }, 
    kin: Sequelize.STRING
    ekmMeterSerialNumber: Sequelize.STRING,
    location: Sequelize.STRING,
    locationAddress: Sequelize.STRING,
    locationGPS: Sequelize.Array(Sequelize.DECIMAL),
    chargeType: Sequelize.INTEGER,
    maxVolts: Sequelize.INTEGER,
    maxAmps: Sequelize.INTEGER,
    cumulativeKW: Sequelize.DECIMAL,
    status: Sequelize.STRING,
    inUse: Sequelize.BOOLEAN
  };

  return Station;
});
  