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

// One-to-one
db.station.hasOne( db.media_schedule, { as: 'MediaSchedule' } );

// One-to-many
db.station.hasMany( db.charge_event );
db.station.hasMany( db.plug );
db.station.hasMany( db.weather_reading );
db.station.hasMany( db.station_rating );
db.station.hasMany( db.station_report );
db.station.hasMany( db.ekm_reading );

db.plug.hasMany( db.charge_event );
db.plug.hasMany( db.ekm_reading );

db.user.hasMany( db.station_rating );
db.user.hasMany( db.station_report );
db.user.hasMany( db.charge_event );

db.charge_event.hasMany( db.ekm_reading );
db.media_company.hasMany( db.media_campaign, { as: 'MediaCampaigns' } );

// Many-to-many
db.car.belongsToMany( db.user, { through: 'user_car' } );
db.user.belongsToMany( db.car, { through: 'user_car' } );

db.media_presentation.belongsToMany( db.media_slide, { as: 'MediaSlides', through: 'media_presentation_of_slides' } );
db.media_slide.belongsToMany( db.media_presentation, { as: 'MediaPresentations', through: 'media_presentation_of_slides' } );

db.media_schedule.belongsToMany( db.media_presentation, { as: 'MediaPresentations', through: 'media_schedule_of_presentations' } );
db.media_presentation.belongsToMany( db.media_schedule, { as: 'MediaSchedules', through: 'media_schedule_of_presentations' } );

db.media_campaign.belongsToMany( db.station, { as: 'Stations', through: 'media_campaign_stations' } );
db.station.belongsToMany( db.media_campaign, { as: 'MediaCampaigns', through: 'media_campaign_stations' } );

db.media_campaign.belongsToMany( db.media_slide, { as: 'MediaSlides', through: 'media_campaign_slides' } );
db.media_slide.belongsToMany( db.media_campaign, { as: 'MediaCampaigns', through: 'media_campaign_slides' } );

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
