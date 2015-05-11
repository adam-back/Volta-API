module.exports = function( sequelize, DataTypes ) {
  var station_report = sequelize.define('station_report', {
    id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true
      }, 
    type_of_report: DataTypes.STRING,
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    location_stamp: DataTypes.ARRAY(DataTypes.DECIMAL),
    message: DataTypes.TEXT,
    picture_path: DataTypes.STRING 
  }, { 'underscored': true } );

  return station_report;

  // station_id and user_id added as foreign keys
};