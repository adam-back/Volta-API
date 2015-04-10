var Car = sequelize.define('car', {
	id: { 
		type:Sequelize.INTEGER,
		autoIncrement: true,
		primaryKey: true
	},
	make: Sequelize.STRING,
	model: Sequelize.STRING,
	year: Sequelize.INTEGER,
	trim: Sequelize.STRING,

	batterySizeInkW: Sequelize.INTEGER,
	chargeCurrent: Sequelize.DECIMAL
});