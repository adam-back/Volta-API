module.exports = function( sequelize, DataTypes ) {
  var Station = sequelize.define('Station', {
    id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true
      }, 
    kin: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    version: DataTypes.STRING,
    siteNumber: DataTypes.INTEGER,
    installDate: DataTypes.STRING,
    network: DataTypes.STRING,
    ekmPushMAC: {
      type: DataTypes.STRING,
      unique: true
    },
    ekmOmnimeterSerial: {
      type: DataTypes.STRING,
      unique: true
    },
    SIMCard: {
      type: DataTypes.STRING,
      unique: true
    },
    location: DataTypes.STRING,
    locationAddress: DataTypes.STRING,
    locationGPS: DataTypes.ARRAY(DataTypes.DECIMAL),
    costToAccess: DataTypes.BOOLEAN,
    chargeType: DataTypes.INTEGER,
    cumulativeKW: DataTypes.DECIMAL,
    stationStatus: DataTypes.STRING,
    meterStatus: DataTypes.STRING,
    inUse: DataTypes.BOOLEAN
  });

  return Station;
};
