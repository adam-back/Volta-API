var fs        = require( 'fs');
var path      = require( 'path' );
var Sequelize = require( 'sequelize' );
var basename  = path.basename( module.filename );
var env       = process.env.NODE_ENV || 'development';
var db        = {};
var config    = require( '../config/config' )[ env ];
var sequelize = new Sequelize( config.database, config.username, config.password, config );


// describe relationships
var createRelationshipsBetweenTables = function( m ) {
  m.EKMreading.belongsTo( m.Station );
  m.Station.hasMany( m.EKMreading );
};

fs.readdirSync( __dirname )
  .filter( function( file ) {
    return ( file.indexOf( '.' ) !== 0 ) && ( file !== basename );
  })
  .forEach( function( file ) {
    var model = sequelize[ "import" ]( path.join( __dirname, file ) );
    db[ model.name ] = model;
  });

createRelationshipsBetweenTables( modules.exports );

Object.keys( db ).forEach( function( modelName ) {
  if ( "associate" in db[ modelName ] ) {
    db[ modelName ].associate( db );
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
