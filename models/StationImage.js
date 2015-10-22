module.exports = function( sequelize, DataTypes ) {
  var station_image = sequelize.define('station_image', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    link: DataTypes.TEXT,
    title: DataTypes.STRING,
    description: DataTypes.TEXT,
    date_taken: DataTypes.DATE,
    location_stamp: DataTypes.ARRAY( DataTypes.DECIMAL ),
    approved: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    }
  }, { underscored: true } );

  return station_image;

  // foreign key to join table with station, user
};