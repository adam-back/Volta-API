module.exports = function( sequelize, DataTypes ) {
	var Car = sequelize.define('Car', {
		id: { 
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true
		},
		make: DataTypes.STRING,
		model: DataTypes.STRING,
		year: DataTypes.INTEGER,
		trim: DataTypes.STRING,
		batterySizeInkW: DataTypes.INTEGER,
		chargeCurrent: DataTypes.DECIMAL
	});

	return Car;
};