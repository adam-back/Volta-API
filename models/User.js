module.exports = function( sequelize, DataTypes ) {
  var user = sequelize.define('user', {
  	id: {
  		type: DataTypes.INTEGER,
  		autoIncrement: true,
  		primaryKey: true
  	},
  	first_name: DataTypes.STRING,
    last_name: DataTypes.STRING,
    email: {
      type: DataTypes.STRING,
      unique: true
    },
    username: {
      type: DataTypes.STRING,
      unique: true
    },
    password: DataTypes.STRING,
    facebook_id: DataTypes.STRING,

    //Path to stored image
    user_picture: DataTypes.STRING,
    car_picture: DataTypes.STRING,

    //JSON object containing an array of locations,
    //each of which contain a name for the location and its corresponding address
    //Ex. [ { Name: 'Home', Address: '123 Main St. San Francisco, CA' }, { Name: 'Work', Address: '1500 17th St. San Francisco, CA' } ]
    stored_locations: DataTypes.JSON,

    //An array of station IDs
    favorite_stations: DataTypes.ARRAY( DataTypes.INTEGER ),

    phone_number: DataTypes.STRING,
    number_of_checkins: DataTypes.INTEGER,
    kwh_used: DataTypes.DECIMAL,
    freemium_level: DataTypes.INTEGER,
    number_of_app_uses: DataTypes.INTEGER,
    is_new: DataTypes.BOOLEAN
  }, { paranoid: true, underscored: true } );

  return user;

  // foreign key to join table with user
};