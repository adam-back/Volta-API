module.exports = function( sequelize, DataTypes ) {
  var StationReport = sequelize.define('StationReport', {
    id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true
      }, 
    typeOfReport: DataTypes.STRING,
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    locationStamp: DataTypes.ARRAY(DataTypes.DECIMAL),
    message: DataTypes.TEXT,
    picturePath: DataTypes.STRING 
  });

  return StationReport;

  // stationId and userId added as foreign keys
};