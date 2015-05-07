var fs        = require( 'fs');
var path      = require( 'path' );
var Sequelize = require( 'sequelize' );
var basename  = path.basename( module.filename );
var env       = process.env.NODE_ENV || 'development';
var db        = {};
var config    = require( '../config/config' )[ env ];
var sequelize = new Sequelize( config.database, config.username, config.password, config );


//////////////////
// Import Schemas
//////////////////

fs.readdirSync( __dirname )
  .filter( function( file ) {
    return ( file.indexOf( '.' ) !== 0 ) && ( file !== basename );
  })
  .forEach( function( file ) {
    var model = sequelize[ "import" ]( path.join( __dirname, file ) );
    db[ model.name ] = model;
  });

Object.keys( db ).forEach( function( modelName ) {
  if ( "associate" in db[ modelName ] ) {
    db[ modelName ].associate( db );
  }
});

//////////////////
// Create relationships
//////////////////

// One-to-many
db.Station.hasMany( db.ChargeEvent );
db.Station.hasMany( db.Plug );
db.Station.hasMany( db.WeatherReading );
db.Station.hasMany( db.StationRating );
db.Station.hasMany( db.StationReport );
db.Station.hasMany( db.EKMreading );

db.Plug.hasMany( db.ChargeEvent );
db.Plug.hasMany( db.EKMreading );

db.User.hasMany( db.StationRating );
db.User.hasMany( db.StationReport );
db.User.hasMany( db.ChargeEvent );

db.ChargeEvent.hasMany( db.EKMreading );

// Many-to-many
db.Car.belongsToMany( db.User, { through: 'UserCar' } );
db.User.belongsToMany( db.Car, { through: 'UserCar' } );

//////////////////
// Sync
//////////////////

sequelize.sync()
  .then(function() {
    console.log( 'Successfully synced database on startup.' );
  })
  .catch(function( error ) {
    console.log( 'Error syncing database on startup:', error );
  });

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
