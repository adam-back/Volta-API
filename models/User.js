module.exports = function( sequelize, DataTypes ) {
  var User = sequelize.define('User', {
  	id: { 
  		type: DataTypes.INTEGER,
  		autoIncrement: true,
  		primaryKey: true
  	},
  	firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    email: {
      type: DataTypes.STRING,
      unique: true
    },
    username: {
      type: DataTypes.STRING,
      unique: true
    },
    password: DataTypes.STRING,
    facebookID: DataTypes.STRING,
    
    //Path to stored image
    userPicture: DataTypes.STRING,
    carPicture: DataTypes.STRING,

    //JSON object containing an array of locations,
    //each of which contain a name for the location and its corresponding address
    //Ex. [ { Name: 'Home', Address: '123 Main St. San Francisco, CA' }, { Name: 'Work', Address: '1500 17th St. San Francisco, CA' } ]
    storedLocations: DataTypes.JSON,

    //An array of station IDs
    favoriteStations: DataTypes.ARRAY(DataTypes.INTEGER),

    phoneNumber: DataTypes.STRING,
    numberOfCheckins: DataTypes.INTEGER,
    kWhUsed: DataTypes.DECIMAL,
    fremiumLevel: DataTypes.INTEGER
  });

  return User;
};