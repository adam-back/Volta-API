module.exports = function( sequelize, DataTypes ) {
  var station_schedule = sequelize.define('station_schedule', {
    id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true
    },
    
    kin: {
      type: DataTypes.STRING,
      allowNull: false
    },

    timezone: {
      type: DataTypes.STRING,
      allowNull: false
    },

    monday_on_time: DataTypes.STRING,
    monday_off_time: DataTypes.STRING,

    tuesday_on_time: DataTypes.STRING,
    tuesday_off_time: DataTypes.STRING,

    wednesday_on_time: DataTypes.STRING,
    wednesday_off_time: DataTypes.STRING,

    thursday_on_time: DataTypes.STRING,
    thursday_off_time: DataTypes.STRING,

    friday_on_time: DataTypes.STRING,
    friday_off_time: DataTypes.STRING,

    saturday_on_time: DataTypes.STRING,
    saturday_off_time: DataTypes.STRING,

    sunday_on_time: DataTypes.STRING,
    sunday_off_time: DataTypes.STRING,

    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
  }, { 'underscored': true } );

  return station_schedule;

  // station_id added as foreign key
};