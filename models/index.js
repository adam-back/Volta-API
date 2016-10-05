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
  // Stations
db.station.hasMany( db.charge_event );
var HistoricalChargeEvents = db.station.hasMany( db.historical_charge_event, { as: 'HistoricalChargeEvents' } );
var ChargeEventMonthSummaries = db.station.hasMany( db.charge_event_month_summary, { as: 'ChargeEventMonthSummaries' } );
db.station.hasMany( db.plug );
db.station.hasMany( db.weather_reading );
db.station.hasMany( db.station_rating );
db.station.hasMany( db.station_report );
db.station.hasMany( db.station_image );
db.station.hasMany( db.ekm_reading );
db.station.hasMany( db.historical_ekm_reading, { as: 'HistoricalReadings' } );
var ReadingHourSummaries = db.station.hasMany( db.ekm_reading_hour_summary, { as: 'ReadingHourSummaries' } );
var ReadingDaySummaries = db.station.hasMany( db.ekm_reading_day_summary, { as: 'ReadingDaySummaries' } );
var ReadingMonthSummaries = db.station.hasMany( db.ekm_reading_month_summary, { as: 'ReadingMonthSummaries' } );
db.station.hasMany( db.idle_chunk );
db.station.hasMany( db.historical_idle_chunk );

  // Plugs
db.plug.hasMany( db.charge_event );
db.plug.hasMany( db.historical_charge_event, { as: 'HistoricalChargeEvents' } );
db.plug.hasMany( db.charge_event_month_summary, { as: 'ChargeEventMonthSummaries' } );
db.plug.hasMany( db.ekm_reading );
db.plug.hasMany( db.historical_ekm_reading, { as: 'HistoricalReadings' } );
db.plug.hasMany( db.ekm_reading_hour_summary, { as: 'ReadingHourSummaries' } );
db.plug.hasMany( db.ekm_reading_day_summary, { as: 'ReadingDaySummaries' } );
db.plug.hasMany( db.ekm_reading_month_summary, { as: 'ReadingMonthSummaries' } );
db.plug.hasMany( db.idle_chunk );
db.plug.hasMany( db.historical_idle_chunk );

  // Users
db.user.hasMany( db.station_rating );
db.user.hasMany( db.station_report );
db.user.hasMany( db.station_image );
db.user.hasMany( db.charge_event );

  // Charge Events
db.charge_event.hasMany( db.ekm_reading );

  // Historical
var HistoricalReadings = db.historical_charge_event.hasMany( db.historical_ekm_reading, { as: 'HistoricalReadings' } );
db.charge_event_month_summary.hasMany( db.historical_charge_event, { as: 'HistoricalChargeEvents' } );
db.ekm_reading_hour_summary.hasMany( db.historical_ekm_reading );
db.ekm_reading_day_summary.hasMany( db.ekm_reading_hour_summary );
db.ekm_reading_month_summary.hasMany( db.ekm_reading_day_summary );

db.media_company.hasMany( db.media_campaign, { as: 'MediaCampaigns' } );

// Many-to-many
db.car.belongsToMany( db.user, { through: 'user_car' } );
db.user.belongsToMany( db.car, { through: 'user_car' } );

db.media_presentation.belongsToMany( db.media_slide, { as: 'MediaSlides', through: 'media_presentation_of_slides' } );
db.media_slide.belongsToMany( db.media_presentation, { as: 'MediaPresentations', through: 'media_presentation_of_slides' } );

db.media_presentation.hasMany( db.media_schedule, { as: 'MediaSchedules' } );
// db.media_schedule.belongsToMany( db.media_presentation, { as: 'MediaPresentations', through: 'media_schedule_of_presentations' } );
// db.media_presentation.belongsToMany( db.media_schedule, { as: 'MediaSchedules', through: 'media_schedule_of_presentations' } );

db.media_campaign.belongsToMany( db.station, { as: 'Stations', through: 'media_campaign_stations' } );
db.station.belongsToMany( db.media_campaign, { as: 'MediaCampaigns', through: 'media_campaign_stations' } );

db.media_campaign.belongsToMany( db.media_slide, { as: 'MediaSlides', through: 'media_campaign_slides' } );
db.media_slide.belongsToMany( db.media_campaign, { as: 'MediaCampaigns', through: 'media_campaign_slides' } );

db.app_sponsor.belongsToMany( db.station, { as: 'Stations', through: 'station_app_sponsors' } );
db.station.belongsToMany( db.app_sponsor, { as: 'AppSponsors', through: 'station_app_sponsors' } );

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
db.HistoricalChargeEvents = HistoricalChargeEvents;
db.ChargeEventMonthSummaries = ChargeEventMonthSummaries;
db.HistoricalReadings = HistoricalReadings;
db.ReadingHourSummaries = ReadingHourSummaries;
db.ReadingDaySummaries = ReadingDaySummaries;
db.ReadingMonthSummaries = ReadingMonthSummaries;

module.exports = db;
