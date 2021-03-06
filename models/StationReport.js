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
    location_stamp: DataTypes.ARRAY( DataTypes.DECIMAL ),
    message: DataTypes.TEXT,
    station_location: DataTypes.STRING,
    station_number: DataTypes.INTEGER,
    callback_number: DataTypes.STRING,
    name: DataTypes.STRING,
    picture_path: DataTypes.STRING,
    email: DataTypes.STRING
  }, { 'underscored': true } );

  return station_report;

  // station_id and user_id added as foreign keys
};