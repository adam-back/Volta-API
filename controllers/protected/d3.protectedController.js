var express = require( 'express' );
var Sequelize = require( 'sequelize' );
var station = require( '../../models').station;
var plug = require( '../../models').plug;
var async     = require( 'async' );
var Q = require( 'q' );
var env = process.env.NODE_ENV || 'development';
var config    = require( '../../config/config' )[ env ];

module.exports = exports = {
  getSunburstData: function ( req, res ) {
    // get all the stations which we have data on
    station.findAll( { where: { cumulative_kwh: { $ne: null } }, attributes: [ 'kin', 'cumulative_kwh', 'location_address', 'location', 'network' ] } )
    .then(function( stations ) {
      var unique = {
        network: {},
        city: {},
        location: {},
        kin: {}
      };

      // sort into unique values
      for ( var i = 0; i < stations.length; i++ ) {
        var oneStation = stations[ i ];
        var splitAddress = oneStation.location_address.split( ', ' );
        var city = splitAddress[ splitAddress.length - 2 ];
        unique.network[ oneStation.network ] = true;
        unique.city[ city ] = oneStation.network;
        unique.location[ oneStation.location ] = city;
        // add every kin with relational data
        unique.kin[ oneStation.kin ] = [ oneStation.location, oneStation.cumulative_kwh ];
      }

      // Create flat, parent-child data
      var nodes = [];
      // Root
      nodes.push( { name: 'Meter kWh', parent: null } );

      // Level 1: Networks
      for ( var network in unique.network ) {
        var nameOfNetwork = network;
        if ( nameOfNetwork === 'Chicago' ) {
          nameOfNetwork = 'Chicagoland';
        }
        nodes.push( { name: nameOfNetwork, parent: 'Meter kWh' } );
      }

      // Level 2: Cities
      for ( var city in unique.city ) {
        var parent = unique.city[ city ];
        if ( parent === 'Chicago' ) {
          parent = 'Chicagoland';
        }
        // { name: city, parent: network }
        // { name: San Francisco, parent: NoCal }
        nodes.push( { name: city, parent: parent } );
      }

      // Level 3: Locations
      for ( var location in unique.location ) {
        // { name: location, parent: city }
        // { name: Stonestown, parent: San Francisco }
        nodes.push( { name: location, parent: unique.location[ location ] } );
      }

      // Level 4: Stations
      for ( var kin in unique.kin ) {
        // { name: kin, parent: location, size: cumulative_kwh }
        // { name: 001-0001-001-01-K, parent: Stonestown, size: 1023.3 }
        nodes.push( { name: kin, parent: unique.kin[ kin ][ 0 ], size: parseFloat( unique.kin[ kin ][ 1 ] ) } );
      }

      // credit: http://bl.ocks.org/d3noob/8329404
      // *********** Convert flat data into a nice tree ***************
      // create a { name: node } map
      var dataMap = nodes.reduce(function( map, node ) {
        map[ node.name ] = node;
        return map;
      }, {} );

      // create the tree array
      var treeData = [];
      nodes.forEach(function( node ) {
        // add to parent
        var parent = dataMap[ node.parent ];
        if ( parent ) {
          // create child array if it doesn't exist
          if ( !parent.children ) {
            parent.children = [];
          }

          // add node to child array
          parent.children.push( node );

        } else {
          // parent is null or missing
          treeData.push( node );
        }
      });

      res.send( treeData[ 0 ] );
    });
  }
};
