var User = sequelize.define('user', {
	id: { 
		type:Sequelize.INTEGER,
		autoIncrement: true,
		primaryKey: true
	},
	firstName: Sequelize.STRING,
  lastName: Sequelize.STRING,
  email: Sequelize.STRING,
  
  username: Sequelize.STRING,
  password: Sequelize.STRING,
  facebookID: Sequelize.STRING,
  
  //Path to stored image
  userPicture: Sequelize.STRING,
  carPicture: Sequelize.STRING,
  
  carID: Sequelize.INTEGER,

  //JSON object containing an array of locations,
  //each of which contain a name for the location and its corresponding address
  //Ex. [ { Name: 'Home', Address: '123 Main St. San Francisco, CA' }, { Name: 'Work', Address: '1500 17th St. San Francisco, CA' } ]
  storedLocations: Sequelize.JSON,

  //An array of station IDs
  favoriteStations: Sequelize.ARRAY(Sequelize.INTEGER),

  phoneNumber: Sequelize.STRING,
  numberOfCheckins: Sequelize.INTEGER,
  kWhUsed: Sequelize.DECIMAL,
  fremiumLevel: Sequelize.INTEGER
});