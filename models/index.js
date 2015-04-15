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
  m.Station.hasMany( m.EKMreading, { as: { singular: 'reading', plural: 'readings'} } );
};

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

createRelationshipsBetweenTables( db );

db.Station.findOrCreate({where: {'kin': '007-0020-001-04-K'}, defaults: {
    'kin': '007-0020-001-04-K',
    'siteNumber': 2,
    'ekmPushMAC': '4016FA010191',
    'ekmOmnimeterSerial': '15159',
    'SIMCard': 9146,
    'location': 'Scottsdale Quarter SW'
  }})
  .spread(function(station, created) {
    console.log(station.get({
      plain: true
    }));
    console.log("Created?", created);
  });

sequelize.sync();

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
