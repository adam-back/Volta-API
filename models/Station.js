module.exports = function( sequelize, DataTypes ) {
  var Station = sequelize.define('Station', {
    id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true
      }, 
    kin: DataTypes.STRING,
    siteNumber: DataTypes.INTEGER,
    ekmPushMAC: DataTypes.STRING,
    ekmOmnimeterSerial: DataTypes.STRING,
    SIMCard: DataTypes.INTEGER,
    location: DataTypes.STRING,
    locationAddress: DataTypes.STRING,
    locationGPS: DataTypes.ARRAY(DataTypes.DECIMAL),
    chargeType: DataTypes.INTEGER,
    maxVolts: DataTypes.INTEGER,
    maxAmps: DataTypes.INTEGER,
    cumulativeKW: DataTypes.DECIMAL,
    status: DataTypes.STRING,
    inUse: DataTypes.BOOLEAN
  });

  return Station;
};
