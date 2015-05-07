module.exports = function( sequelize, DataTypes ) {
  var Plug = sequelize.define('Plug', {
    id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true
    },
    // could be same as station install date,
    // but doesn't have to be if it was added later
    installDate: DataTypes.STRING,
    // RS1772 
    connectorType: DataTypes.STRING,
    // 1, Level 1
    chargerType: DataTypes.INTEGER,
    ekmOmnimeterSerial: {
      type: DataTypes.STRING,
      unique: true
    },
    meterStatus: DataTypes.STRING,
    inUse: DataTypes.BOOLEAN,
    cumulativeKW: DataTypes.DECIMAL
  });

  return Plug;
};
