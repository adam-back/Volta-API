var fs        = require( 'fs');
var path      = require( 'path' );
var Sequelize = require( 'sequelize' );
var basename  = path.basename( module.filename );
var env       = process.env.NODE_ENV || 'development';
var db        = {};
var config    = require( '../config/config' )[ 'production' ];
var sequelize = new Sequelize( config.database, config.username, config.password, config );

sequelize.authenticate()
  .complete(function( err ) {
    if( err ) {
      console.error( "Unable to connect to the database:", err );
    } else {
      console.log( 'Successfully connected to the database.' );
    }
  });

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

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
