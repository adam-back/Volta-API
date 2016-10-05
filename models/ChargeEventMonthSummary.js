module.exports = function( sequelize, DataTypes ) {
	var charge_event_month_summary = sequelize.define('charge_event_month_summary', {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true
		},
    // February 2015
    month: DataTypes.STRING,
		start: DataTypes.DATE,
		end: DataTypes.DATE,

    firstEvent: DataTypes.DATE,
    lastEvent: DataTypes.DATE,

		total_kwh: {
      type: DataTypes.DECIMAL,
      defaultValue: 0
    },
		kwh_for_events: {
      type: DataTypes.ARRAY( DataTypes.DECIMAL ),
      allowNull: false,
      defaultValue: []
    },
		number_of_events: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
		total_minutes: {
      type: DataTypes.DECIMAL,
      defaultValue: 0
    },
		minutes_for_events: {
      type: DataTypes.ARRAY( DataTypes.DECIMAL ),
      allowNull: false,
      defaultValue: []
    }
	}, {
    paranoid: true,
    underscored: true,
    hooks: {
      beforeCreate: function( summary, options ) {
        summary.total_kwh = Number( summary.total_kwh.toFixed( 1 ) );
        summary.total_minutes = Number( summary.total_minutes.toFixed( 1 ) );
      },
      beforeUpdate: function( summary, options ) {
        summary.total_kwh = Number( summary.total_kwh.toFixed( 1 ) );
        summary.total_minutes = Number( summary.total_minutes.toFixed( 1 ) );
      }
    }
  });

	return charge_event_month_summary;

	// foreign keys:
	// station_id, plug_id
};