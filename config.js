var bodyParser    = require( 'body-parser' );
var Sequelize     = require( 'Sequelize' );
var morgan        = require( 'morgan' );
var middle        = require('./middleware');

module.exports.sequelize = new Sequelize( process.env.DB_URL || 'postgres://localhost:5432/voltadb', {} );

/*
 * Include all your global env variables here.
*/
module.exports = exports = function ( app, express, routers ) {
  app.set( 'base url', process.env.URL || 'http://localhost' );
  app.use( morgan( 'dev' ) );
  app.use( middle.cors );
  app.use( '/ekm', routers.EKMrouter );
  app.use( middle.logError );
  app.use( middle.handleError );
};