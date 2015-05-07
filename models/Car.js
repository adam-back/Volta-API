module.exports = function( sequelize, DataTypes ) {
	var car = sequelize.define('car', {
		id: { 
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true
		},
		make: DataTypes.STRING,
		model: DataTypes.STRING,
		year: DataTypes.INTEGER,
		trim: DataTypes.STRING,
		// in kWh
		battery_size: DataTypes.INTEGER,
		charge_current: DataTypes.DECIMAL
	});

	return car;
};