var config    = require( '../../../../config/config' ).development;
var Q = require( 'q' );
var async     = require( 'async' );
var models = require( '../../../../models' );
var rewire = require( 'rewire' );
var controller = rewire( '../../../../controllers/protected/app.protectedController.js' );
var distance = require( '../../../../factories/distanceFactory.js' );

module.exports = function() {
  describe('APP HELPERS', function() {
    describe('countStationAvailability', function() {
      var countStationAvailability = controller.countStationAvailability;
      var usageCollection = [ 'true', 'false', 'null' ];

      it('should be defined as a function', function() {
        expect( typeof countStationAvailability ).toBe( 'function' );
      });

      it('should return a number', function() {
        var numberAvailable = countStationAvailability( usageCollection );
        expect( typeof numberAvailable ).toBe( 'number' );
      });

      it('should count number of available plugs', function() {
        var numberAvailable = countStationAvailability( usageCollection );
        expect( numberAvailable ).toBe( 1 );
      });

      it('should return 0 if no plugs', function() {
        expect( countStationAvailability( [] ) ).toBe( 0 );
      });
    });

    describe('findDistances', function() {
      var findDistances = controller.findDistances;
      var userCoords = [ '1', '2' ];
      var favorites = [ { id: 1, gps: [ '5, 6' ] }, { id: 2, gps: [ '7, 8' ] } ];
      var result;

      beforeEach(function() {
        spyOn( distance, 'getDistanceFromLatLonInMiles' ).andReturn( 5 );
      });

      afterEach(function() {
        result = undefined;
      });

      it('should be defined as a function', function() {
        expect( typeof findDistances ).toBe( 'function' );
      });

      it('should return an array', function() {
        result = findDistances( userCoords, favorites );
        expect( Array.isArray( result ) ).toBe( true );
      });

      it('should add distance to the stations', function() {
        result = findDistances( userCoords, favorites );
        expect( distance.getDistanceFromLatLonInMiles.calls.length ).toBe( 2 );
        expect( distance.getDistanceFromLatLonInMiles.calls[ 0 ].args ).toEqual( [ userCoords, favorites[ 0 ].gps ] );
        expect( distance.getDistanceFromLatLonInMiles.calls[ 1 ].args ).toEqual( [ userCoords, favorites[ 1 ].gps ] );
        for ( var i = 0; i < result.length; i++ ) {
          expect( result[ i ].hasOwnProperty( 'distance' ) ).toBe( true );
          expect( result[ i ].distance ).toBe( 5 );
        }
      });
    });

    describe('connectStationsWithPlugsAndSponsors', function() {
      var connectStationsWithPlugsAndSponsors = controller.connectStationsWithPlugsAndSponsors;
      var stations = [];
      var plugs = [];
      var station1GetPlugPromise, station2GetPlugPromise, station1GetSponsorsPromise, station2GetSponsorsPromise;
      var mockData = {};

      beforeEach(function() {
        mockData.station1 = models.station.build( { id: 1 } );
        mockData.station2 = models.station.build( { id: 2 } );
        mockData.plug1 = models.plug.build( { id: 1, number_on_station: 1 } );
        mockData.plug2 = models.plug.build( { id: 2, number_on_station: 2 } );
        mockData.sponsor1 = models.app_sponsor.build( { id: 1 } );
        mockData.sponsor2 = models.app_sponsor.build( { id: 2 } );

        station1GetPlugPromise = Q.defer();
        station1GetSponsorsPromise = Q.defer();
        station2GetPlugPromise = Q.defer();
        station2GetSponsorsPromise = Q.defer();

        spyOn( mockData.station1, 'getPlugs' ).andReturn( station1GetPlugPromise.promise );
        spyOn( mockData.station1, 'getAppSponsors' ).andReturn( station1GetSponsorsPromise.promise );
        spyOn( mockData.station2, 'getPlugs' ).andReturn( station2GetPlugPromise.promise );
        spyOn( mockData.station2, 'getAppSponsors' ).andReturn( station2GetSponsorsPromise.promise );
        spyOn( mockData.plug1, 'get' ).andCallThrough();
        spyOn( mockData.plug2, 'get' ).andCallThrough();
        spyOn( mockData.sponsor1, 'get' ).andCallThrough();
        spyOn( mockData.sponsor2, 'get' ).andCallThrough();

        stations = [ mockData.station1, mockData.station2 ];
        plugs = [ mockData.plug1, mockData.plug2 ];
      });

      it('should be defined as a function', function() {
        expect( typeof connectStationsWithPlugsAndSponsors ).toBe( 'function' );
      });

      it('should loop through the stations', function( done ) {
        spyOn( async, 'each' ).andCallThrough();

        connectStationsWithPlugsAndSponsors( [] )
        .then(function() {
          expect( async.each ).toHaveBeenCalled();
          expect( async.each.calls[ 0 ].args[ 0 ] ).toEqual( [] );
          done();
        })
        .catch(function( error ) {
          expect( error ).toBe( 1 );
          done();
        });
      });

      it('should create plain, non-DAO version of each station', function( done ) {
        spyOn( mockData.station1, 'get' );
        spyOn( mockData.station2, 'get' );
        station1GetPlugPromise.reject( 'Test' );

        connectStationsWithPlugsAndSponsors( stations )
        .catch(function( error ) {
          expect( mockData.station1.get ).toHaveBeenCalled();
          expect( mockData.station1.get ).toHaveBeenCalledWith( { plain: true } );
          expect( mockData.station2.get ).toHaveBeenCalled();
          expect( mockData.station2.get ).toHaveBeenCalledWith( { plain: true } );
          done();
        });
      });

      it('should get plugs for each station', function( done ) {
        station1GetPlugPromise.reject( 'Test' );

        connectStationsWithPlugsAndSponsors( stations )
        .catch(function( error ) {
          expect( mockData.station1.getPlugs ).toHaveBeenCalled();
          expect( mockData.station1.getPlugs ).toHaveBeenCalledWith();
          expect( mockData.station2.getPlugs ).toHaveBeenCalled();
          expect( mockData.station2.getPlugs ).toHaveBeenCalledWith();
          done();
        });
      });

      it('should get app sponsors for each station', function( done ) {
        station1GetPlugPromise.resolve( plugs );
        station2GetPlugPromise.resolve( [] );
        station1GetSponsorsPromise.reject( 'Test' );

        connectStationsWithPlugsAndSponsors( stations )
        .catch(function( error ) {
          expect( mockData.station1.getAppSponsors ).toHaveBeenCalled();
          expect( mockData.station1.getAppSponsors ).toHaveBeenCalledWith();
          expect( mockData.station2.getAppSponsors ).toHaveBeenCalled();
          expect( mockData.station2.getAppSponsors ).toHaveBeenCalledWith();
          done();
        });
      });

      it('should add plain, non-DAO plugs to plain stations', function( done ) {
        station1GetPlugPromise.resolve( [ mockData.plug1 ] );
        mockData.plug2.number_on_station = 1;
        station2GetPlugPromise.resolve( [ mockData.plug2 ] );
        station1GetSponsorsPromise.resolve( [] );
        station2GetSponsorsPromise.resolve( [] );


        connectStationsWithPlugsAndSponsors( stations )
        .then(function( result ) {
          expect( result.length ).toBe( 2 );
          expect( Array.isArray( result[ 0 ].plugs ) ).toBe( true );
          expect( result[ 0 ].plugs.length ).toBe( 1 );
          expect( result[ 0 ].plugs[ 0 ] ).toEqual( mockData.plug1.get( { plain: true } ) );
          expect( Array.isArray( result[ 1 ].plugs ) ).toBe( true );
          expect( result[ 1 ].plugs.length ).toBe( 1 );
          expect( result[ 1 ].plugs[ 0 ] ).toBe( mockData.plug2.get( { plain: true } ) );
          done();
        })
        .catch(function( error ) {
          expect( error ).toBe( 1 );
          done();
        });
      });

      it('should add null to plain stations if no plugs', function( done ) {
        station1GetPlugPromise.resolve( plugs );
        station2GetPlugPromise.resolve( [] );
        station1GetSponsorsPromise.resolve( [] );
        station2GetSponsorsPromise.resolve( [] );


        connectStationsWithPlugsAndSponsors( stations )
        .then(function( result ) {
          expect( result.length ).toBe( 2 );
          expect( Array.isArray( result[ 0 ].plugs ) ).toBe( true );
          expect( result[ 0 ].plugs.length ).toBe( 2 );
          expect( result[ 0 ].plugs[ 0 ] ).toEqual( mockData.plug1.get( { plain: true } ) );
          expect( result[ 0 ].plugs[ 1 ] ).toBe( mockData.plug2.get( { plain: true } ) );
          expect( result[ 1 ].plugs ).toBe( null );
          done();
        })
        .catch(function( error ) {
          expect( error ).toBe( 1 );
          done();
        });
      });

      it('should add plain, non-DAO app_sponsors to plain stations', function( done ) {
        station1GetPlugPromise.resolve( plugs );
        station2GetPlugPromise.resolve( [] );
        station1GetSponsorsPromise.resolve( [ mockData.sponsor1 ] );
        station2GetSponsorsPromise.resolve( [ mockData.sponsor2 ] );


        connectStationsWithPlugsAndSponsors( stations )
        .then(function( result ) {
          expect( result.length ).toBe( 2 );
          expect( Array.isArray( result[ 0 ].app_sponsors ) ).toBe( true );
          expect( result[ 0 ].app_sponsors.length ).toBe( 1 );
          expect( result[ 0 ].app_sponsors[ 0 ] ).toEqual( mockData.sponsor1.get( { plain: true } ) );
          expect( Array.isArray( result[ 1 ].app_sponsors ) ).toBe( true );
          expect( result[ 1 ].app_sponsors.length ).toBe( 1 );
          expect( result[ 1 ].app_sponsors[ 0 ] ).toEqual( mockData.sponsor2.get( { plain: true } ) );
          done();
        })
        .catch(function( error ) {
          expect( error ).toBe( 1 );
          done();
        });
      });

      it('should add [] to plain stations if no app_sponsors', function( done ) {
        station1GetPlugPromise.resolve( plugs );
        station2GetPlugPromise.resolve( [] );
        station1GetSponsorsPromise.resolve( [ mockData.sponsor1, mockData.sponsor2 ] );
        station2GetSponsorsPromise.resolve( [] );

        connectStationsWithPlugsAndSponsors( stations )
        .then(function( result ) {
          expect( result.length ).toBe( 2 );
          expect( Array.isArray( result[ 0 ].app_sponsors ) ).toBe( true );
          expect( result[ 0 ].app_sponsors.length ).toBe( 2 );
          expect( result[ 0 ].app_sponsors[ 0 ] ).toEqual( mockData.sponsor1.get( { plain: true } ) );
          expect( result[ 0 ].app_sponsors[ 1 ] ).toEqual( mockData.sponsor2.get( { plain: true } ) );
          expect( Array.isArray( result[ 1 ].app_sponsors ) ).toBe( true );
          expect( result[ 1 ].app_sponsors.length ).toBe( 0 );
          done();
        })
        .catch(function( error ) {
          expect( error ).toBe( 1 );
          done();
        });
      });
    });

    describe('attachImages', function() {
      var attachImages = controller.attachImages;
      var foundStation, findStation, getImages;
      var groupsOfStations;

      beforeEach(function() {
        groupsOfStations = {
          '001-0001-001': {
            images: [],
            thumbnail: null,
            stations: [{
              kin: '001-0001-001-01-K'
            }]
          },
          '002-0002-002': {
            images: [],
            thumbnail: null,
            stations: [{
              kin: '002-0002-002-01-K'
            },
            {
              kin: '002-0002-002-02-K'
            }]
          }
        };
        foundStation = {
          kin: '001-0001-001-01-K',
          getStation_images: function() {
            return void( 0 );
          }
        };
        findStation = Q.defer();
        getImages = Q.defer();
        spyOn( models.station, 'find' ).andReturn( findStation.promise );
        spyOn( foundStation, 'getStation_images' ).andReturn( getImages.promise );
      });

      it('should be defined as a function', function() {
        expect( typeof attachImages ).toBe( 'function' );
      });

      it('should loop over each key in object', function( done ) {
        spyOn( async, 'forEachOf' ).andCallThrough();
        attachImages( {} )
        .then(function(  ) {
          expect( async.forEachOf ).toHaveBeenCalled();
          expect( async.forEachOf.calls[ 0 ].args[ 0 ] ).toEqual( {} );
          done();
        })
        .catch(function( error ) {
          expect( error ).toBe( 1 );
          done();
        });
      });

      it('should find each station', function( done ) {
        findStation.reject( 'Test' );
        attachImages( groupsOfStations )
        .catch(function( error ) {
          expect( models.station.find ).toHaveBeenCalled();
          expect( models.station.find ).toHaveBeenCalledWith( { where: { kin: '001-0001-001-01-K' } } );
          done();
        });
      });

      it('should get each station\'s images', function( done ) {
        findStation.resolve( foundStation );
        getImages.reject( 'Test' );
        attachImages( groupsOfStations )
        .catch(function( error ) {
          expect( foundStation.getStation_images ).toHaveBeenCalled();
          expect( foundStation.getStation_images ).toHaveBeenCalledWith();
          done();
        });
      });

      it('should attach a thumbnail and highres image links', function( done ) {
        findStation.resolve( foundStation );
        getImages.resolve( [ { link: '1'}, { link: 'thumb' }, { link: '2' } ] );
        attachImages( groupsOfStations )
        .then(function( groups ) {
          expect( typeof groups ).toBe( 'object' );
          expect( Array.isArray( groups ) ).toBe( false );
          // group 1
          expect( groups[ '001-0001-001' ].thumbnail ).toBe( 'thumb' );
          expect( Array.isArray( groups[ '001-0001-001' ].images ) ).toBe( true );
          expect( groups[ '001-0001-001' ].images.length ).toBe( 2 );
          expect( groups[ '001-0001-001' ].images[ 0 ] ).toBe( '1' );
          expect( groups[ '001-0001-001' ].images[ 1 ] ).toBe( '2' );
          // group 2
          expect( groups[ '002-0002-002' ].thumbnail ).toBe( 'thumb' );
          expect( Array.isArray( groups[ '002-0002-002' ].images ) ).toBe( true );
          expect( groups[ '002-0002-002' ].images.length ).toBe( 2 );
          expect( groups[ '002-0002-002' ].images[ 0 ] ).toBe( '1' );
          expect( groups[ '002-0002-002' ].images[ 1 ] ).toBe( '2' );
          done();
        })
        .catch(function( error ) {
          expect( error ).toBe( 1 );
          done();
        });
      });

      it('should not attach anything if no images', function( done ) {
        findStation.resolve( foundStation );
        getImages.resolve( [] );
        attachImages( groupsOfStations )
        .then(function( groups ) {
          expect( typeof groups ).toBe( 'object' );
          expect( Array.isArray( groups ) ).toBe( false );
          // group 1
          expect( groups[ '001-0001-001' ].thumbnail ).toBe( null );
          expect( Array.isArray( groups[ '001-0001-001' ].images ) ).toBe( true );
          expect( groups[ '001-0001-001' ].images.length ).toBe( 0 );
          // group 2
          expect( groups[ '002-0002-002' ].thumbnail ).toBe( null );
          expect( Array.isArray( groups[ '002-0002-002' ].images ) ).toBe( true );
          expect( groups[ '002-0002-002' ].images.length ).toBe( 0 );
          done();
        })
        .catch(function( error ) {
          expect( error ).toBe( 1 );
          done();
        });
      });
    });

    describe('groupByKin', function() {
      var groupByKin = controller.groupByKin;
      var station1, station2;
      var stationsWithPlugs;
      var stationData = {
        "kin": "003-0043-015",
        "location": "Macy's - The Oaks",
        "address": "350 West Hillcrest Drive, Thousand Oaks, CA 91360",
        "thumbnail": null,
        "images": [],
        "gps": [
          34.18437256,
          -118.88682462
        ],
        "url": null,
        "ids": [
          148,
          149
        ],
        "app_sponsors": [
          {
            "id": 1,
            "company": "Chevrolet",
            "networks": [
              "SD",
              "OC",
              "LA",
              "SB",
              "NoCal"
            ],
            "website_url": null,
            "twitter_url": null,
            "facebook_url": null,
            "instagram_url": null,
            "logo_url": "https:\/\/ad.doubleclick.net\/ddm\/ad\/N8334.2076903VOLTAINDUSTRIESIN\/B9247890.125572247;sz=1024x543;ord=",
            "station_query": {
              "where": {
                "network": {
                  "$in": [
                    "SD",
                    "OC",
                    "LA",
                    "SB",
                    "NoCal"
                  ]
                }
              }
            },
            "banner_url": "https:\/\/ad.doubleclick.net\/ddm\/ad\/N8334.2076903VOLTAINDUSTRIESIN\/B9247890.125572647;sz=640x100;ord=",
            "order": 1,
            "start": null,
            "end": null,
            "current": true,
            "banner_click_url": "https:\/\/app-server.voltaapi.com\/Chevrolet\/BannerForwarding.html",
            "logo_click_url": "https:\/\/app-server.voltaapi.com\/Chevrolet\/LogoForwarding.html",
            "created_at": "2015-09-12T00:16:42.238Z",
            "updated_at": "2015-09-12T00:16:42.238Z",
            "station_app_sponsors": {
              "created_at": "2015-12-31T22:15:22.123Z",
              "updated_at": "2015-12-31T22:15:22.123Z",
              "station_id": 148,
              "app_sponsor_id": 1
            }
          }
        ],
        "number_available": [
          2,
          2
        ],
        "distance": null,
        "stations": [
          {
            "id": 148,
            "kin": "003-0043-015-01-K",
            "version": "2",
            "site_number": 1,
            "install_date": "2015-10-01T07:00:00.000Z",
            "network": "LA",
            "ekm_push_mac": "4016FA01044B",
            "sim_card": "89011704252308111266",
            "has_kill_switch": null,
            "location": "Macy's - The Oaks",
            "location_address": "350 West Hillcrest Drive, Thousand Oaks, CA 91360",
            "location_description": null,
            "location_gps": [
              34.18437256,
              -118.88682462
            ],
            "cost_to_access": true,
            "cumulative_kwh": 3132.7,
            "station_status": null,
            "has_digital_front_display": null,
            "front_display_pc_serial_number": null,
            "in_use": [
              "false"
            ],
            "created_at": "2015-12-31T22:15:21.930Z",
            "updated_at": "2016-02-22T19:02:53.565Z",
            "deleted_at": null,
            "app_sponsors": [
              {
                "id": 1,
                "company": "Chevrolet",
                "networks": [
                  "SD",
                  "OC",
                  "LA",
                  "SB",
                  "NoCal"
                ],
                "website_url": null,
                "twitter_url": null,
                "facebook_url": null,
                "instagram_url": null,
                "logo_url": "https:\/\/ad.doubleclick.net\/ddm\/ad\/N8334.2076903VOLTAINDUSTRIESIN\/B9247890.125572247;sz=1024x543;ord=",
                "station_query": {
                  "where": {
                    "network": {
                      "$in": [
                        "SD",
                        "OC",
                        "LA",
                        "SB",
                        "NoCal"
                      ]
                    }
                  }
                },
                "banner_url": "https:\/\/ad.doubleclick.net\/ddm\/ad\/N8334.2076903VOLTAINDUSTRIESIN\/B9247890.125572647;sz=640x100;ord=",
                "order": 1,
                "start": null,
                "end": null,
                "current": true,
                "banner_click_url": "https:\/\/app-server.voltaapi.com\/Chevrolet\/BannerForwarding.html",
                "logo_click_url": "https:\/\/app-server.voltaapi.com\/Chevrolet\/LogoForwarding.html",
                "created_at": "2015-09-12T00:16:42.238Z",
                "updated_at": "2015-09-12T00:16:42.238Z",
                "station_app_sponsors": {
                  "created_at": "2015-12-31T22:15:22.123Z",
                  "updated_at": "2015-12-31T22:15:22.123Z",
                  "station_id": 148,
                  "app_sponsor_id": 1
                }
              }
            ],
            "plugs": [
              {
                "id": 132,
                "number_on_station": 1,
                "install_date": "2015-10-01T07:00:00.000Z",
                "connector_type": "J1772",
                "charger_type": 2,
                "max_amps": null,
                "ekm_omnimeter_serial": "16439",
                "meter_status": "on",
                "meter_status_message": "idle",
                "in_use": false,
                "cumulative_kwh": 3132.7,
                "created_at": "2016-02-09T20:28:50.931Z",
                "updated_at": "2016-02-22T19:02:53.559Z",
                "deleted_at": null,
                "station_id": 148
              }
            ]
          },
          {
            "id": 149,
            "kin": "003-0043-015-02-K",
            "version": "2",
            "site_number": 2,
            "install_date": "2015-10-01T07:00:00.000Z",
            "network": "LA",
            "ekm_push_mac": "4016FA010465",
            "sim_card": "89011704252308110896",
            "has_kill_switch": null,
            "location": "Macy's - The Oaks",
            "location_address": "350 West Hillcrest Drive, Thousand Oaks, CA 91360",
            "location_description": null,
            "location_gps": [
              34.18442546,
              -118.88678338
            ],
            "cost_to_access": true,
            "cumulative_kwh": 2860.8,
            "station_status": null,
            "has_digital_front_display": null,
            "front_display_pc_serial_number": null,
            "in_use": [
              "false"
            ],
            "created_at": "2015-12-31T22:43:23.097Z",
            "updated_at": "2016-02-23T04:20:57.480Z",
            "deleted_at": null,
            "app_sponsors": [
              {
                "id": 1,
                "company": "Chevrolet",
                "networks": [
                  "SD",
                  "OC",
                  "LA",
                  "SB",
                  "NoCal"
                ],
                "website_url": null,
                "twitter_url": null,
                "facebook_url": null,
                "instagram_url": null,
                "logo_url": "https:\/\/ad.doubleclick.net\/ddm\/ad\/N8334.2076903VOLTAINDUSTRIESIN\/B9247890.125572247;sz=1024x543;ord=",
                "station_query": {
                  "where": {
                    "network": {
                      "$in": [
                        "SD",
                        "OC",
                        "LA",
                        "SB",
                        "NoCal"
                      ]
                    }
                  }
                },
                "banner_url": "https:\/\/ad.doubleclick.net\/ddm\/ad\/N8334.2076903VOLTAINDUSTRIESIN\/B9247890.125572647;sz=640x100;ord=",
                "order": 1,
                "start": null,
                "end": null,
                "current": true,
                "banner_click_url": "https:\/\/app-server.voltaapi.com\/Chevrolet\/BannerForwarding.html",
                "logo_click_url": "https:\/\/app-server.voltaapi.com\/Chevrolet\/LogoForwarding.html",
                "created_at": "2015-09-12T00:16:42.238Z",
                "updated_at": "2015-09-12T00:16:42.238Z",
                "station_app_sponsors": {
                  "created_at": "2015-12-31T22:43:23.111Z",
                  "updated_at": "2015-12-31T22:43:23.111Z",
                  "station_id": 149,
                  "app_sponsor_id": 1
                }
              }
            ],
            "plugs": [
              {
                "id": 125,
                "number_on_station": 1,
                "install_date": "2015-11-04T08:00:00.000Z",
                "connector_type": "RS1772",
                "charger_type": 2,
                "max_amps": null,
                "ekm_omnimeter_serial": "16459",
                "meter_status": "on",
                "meter_status_message": "idle",
                "in_use": false,
                "cumulative_kwh": 2860.8,
                "created_at": "2016-01-14T21:31:14.082Z",
                "updated_at": "2016-02-23T04:20:57.478Z",
                "deleted_at": null,
                "station_id": 149
              }
            ]
          }
        ],
        "favorite": false,
        "addressLine1": "350 West Hillcrest Drive",
        "addressLine2": "Thousand Oaks, CA 91360",
        "androidGPS": {
          "latitude": 34.18437256,
          "longitude": -118.88682462
        }
      };

      beforeEach(function() {
        station1 = stationData.stations[ 0 ];
        station2 = stationData.stations[ 1 ];
        stationsWithPlugs = [ station1, station2 ];
      })

      it('should be defined as a function', function() {
        expect( typeof groupByKin ).toBe( 'function' );
      });

      it('should return an object', function() {
        expect( typeof groupByKin( stationsWithPlugs ) ).toBe( 'object' );
      });

      it('should group similar KINs together', function() {
        var result = groupByKin( stationsWithPlugs );
        expect( Object.keys( result ).length ).toBe( 1 );
        expect( result.hasOwnProperty( '003-0043-015' ) ).toBe( true );
      });

      it('should have common fields', function() {
        var result = groupByKin( stationsWithPlugs );
        expect( result[ '003-0043-015' ].kin ).toBe( '003-0043-015' );
        expect( result[ '003-0043-015' ].location ).toBe( 'Macy\'s - The Oaks' );
        expect( result[ '003-0043-015' ].address ).toBe( '350 West Hillcrest Drive, Thousand Oaks, CA 91360' );
        expect( result[ '003-0043-015' ].addressLine1 ).toBe( '350 West Hillcrest Drive' );
        expect( result[ '003-0043-015' ].addressLine2 ).toBe( 'Thousand Oaks, CA 91360' );
        expect( result[ '003-0043-015' ].thumbnail ).toBe( null );
        expect( result[ '003-0043-015' ].images ).toEqual( [] );
        expect( result[ '003-0043-015' ].gps ).toEqual( [ 34.18437256, -118.88682462 ] );
        expect( result[ '003-0043-015' ].androidGPS ).toEqual( { latitude: 34.18437256, longitude: -118.88682462 } );
        expect( result[ '003-0043-015' ].url ).toBe( null );
        expect( result[ '003-0043-015' ].ids ).toEqual( [ 148, 149 ] );
        expect( result[ '003-0043-015' ].app_sponsors ).toEqual( [
          {
            "id": 1,
            "company": "Chevrolet",
            "networks": [
              "SD",
              "OC",
              "LA",
              "SB",
              "NoCal"
            ],
            "website_url": null,
            "twitter_url": null,
            "facebook_url": null,
            "instagram_url": null,
            "logo_url": "https:\/\/ad.doubleclick.net\/ddm\/ad\/N8334.2076903VOLTAINDUSTRIESIN\/B9247890.125572247;sz=1024x543;ord=",
            "station_query": {
              "where": {
                "network": {
                  "$in": [
                    "SD",
                    "OC",
                    "LA",
                    "SB",
                    "NoCal"
                  ]
                }
              }
            },
            "banner_url": "https:\/\/ad.doubleclick.net\/ddm\/ad\/N8334.2076903VOLTAINDUSTRIESIN\/B9247890.125572647;sz=640x100;ord=",
            "order": 1,
            "start": null,
            "end": null,
            "current": true,
            "banner_click_url": "https:\/\/app-server.voltaapi.com\/Chevrolet\/BannerForwarding.html",
            "logo_click_url": "https:\/\/app-server.voltaapi.com\/Chevrolet\/LogoForwarding.html",
            "created_at": "2015-09-12T00:16:42.238Z",
            "updated_at": "2015-09-12T00:16:42.238Z",
            "station_app_sponsors": {
              "created_at": "2015-12-31T22:15:22.123Z",
              "updated_at": "2015-12-31T22:15:22.123Z",
              "station_id": 148,
              "app_sponsor_id": 1
            }
          }
        ] );
        expect( result[ '003-0043-015' ].number_available ).toEqual( [ 2, 2 ] );
        expect( result[ '003-0043-015' ].distance ).toBe( null );
        expect( result[ '003-0043-015' ].stations ).toEqual( [ station1, station2 ] );
        expect( result[ '003-0043-015' ].favorite ).toBe( false );
      });

      it('should set a group as a favorite', function() {
        var result = groupByKin( stationsWithPlugs, [ 148 ] );
        expect( result[ '003-0043-015' ].favorite ).toBe( true );
      });

      it('should not set a group as a favorite', function() {
        var result = groupByKin( stationsWithPlugs, [ 42 ] );
        expect( result[ '003-0043-015' ].favorite ).toBe( false );
      });

      it('should correctly split address with two commas', function() {
        var result = groupByKin( stationsWithPlugs );
        expect( result[ '003-0043-015' ].address ).toBe( '350 West Hillcrest Drive, Thousand Oaks, CA 91360' );
        expect( result[ '003-0043-015' ].addressLine1 ).toBe( '350 West Hillcrest Drive' );
        expect( result[ '003-0043-015' ].addressLine2 ).toBe( 'Thousand Oaks, CA 91360' );
      });

      it('should correctly split address with three commas', function() {
        stationsWithPlugs.pop();
        stationsWithPlugs[ 0 ].location_address = '123 Main, Apt. A, Toledo, OH 43611';
        var result = groupByKin( stationsWithPlugs );
        expect( result[ '003-0043-015' ].address ).toBe( '123 Main, Apt. A, Toledo, OH 43611' );
        expect( result[ '003-0043-015' ].addressLine1 ).toBe( '123 Main, Apt. A' );
        expect( result[ '003-0043-015' ].addressLine2 ).toBe( 'Toledo, OH 43611' );
      });

      it('should count stations as availabile if we otherwise don\'t know', function() {
        spyOn( controller, 'countStationAvailability' ).andCallThrough();
        delete stationsWithPlugs[ 0 ].in_use;
        stationsWithPlugs[ 1 ].in_use = [ 'true' ];
        var result = groupByKin( stationsWithPlugs );
        expect( controller.countStationAvailability.calls.length ).toBe( 1 );
        expect( controller.countStationAvailability ).toHaveBeenCalledWith( [ 'true' ] );
        expect( result[ '003-0043-015' ].number_available ).toEqual( [ 1, 2 ] );
      });

      it('should only add app sponsors once', function() {
        station1.app_sponsors = [ 'obi' ];
        station2.app_sponsors = [ 'wan' ];
        var result = groupByKin( stationsWithPlugs );
        expect( result[ '003-0043-015' ].app_sponsors.length ).toBe( 1 );
        expect( result[ '003-0043-015' ].app_sponsors ).toEqual( [ 'obi' ] );
      });
    });

    describe('geocodeOneGroup', function() {
      var geocodeOneGroup = controller.geocodeOneGroup;
      var geocode, revert, mockGeocode;

      beforeEach(function() {
        geocodeCache = {};
      });

      afterEach(function(  ) {
        if ( typeof revert === 'function' ) {
          revert();
        }
      });

      it('should be defined as a function', function() {
        expect( typeof geocodeOneGroup ).toBe( 'function' );
      });

      it('should endcode address', function( done ) {
        mockGeocode = {
          geocode: function( address, cb ) {
            expect( address ).toBe( '123 Main' );
            cb( null, [ { latitude: 2, longitude: 3 } ] );
          }
        };
        spyOn( mockGeocode, 'geocode' ).andCallThrough();
        revert = controller.__set__( 'geocoder', mockGeocode );

        geocodeOneGroup( '1', '123 Main' )
        .then(function( gpx ) {
          expect( mockGeocode.geocode ).toHaveBeenCalled();
          done();
        })
        .catch(function( error ) {
          expect( error ).toBe( 1 );
          done();
        });
      });

      it('should return array with kin and gps data', function( done ) {
        mockGeocode = {
          geocode: function( address, cb ) {
            expect( address ).toBe( '123 Main' );
            cb( null, [ { latitude: 2, longitude: 3 } ] );
          }
        };
        revert = controller.__set__( 'geocoder', mockGeocode );

        geocodeOneGroup( '1', '123 Main' )
        .then(function( gpx ) {
          expect( Array.isArray( gpx ) ).toBe( true );
          expect( gpx[ 0 ] ).toBe( '1' );
          expect( gpx[ 1 ][ 0 ].latitude ).toBe( 2 );
          expect( gpx[ 1 ][ 0 ].longitude ).toBe( 3 );
          done();
        })
        .catch(function( error ) {
          expect( error ).toBe( 1 );
          done();
        });
      });

      it('should populate the geocodeCache', function( done ) {
        mockGeocode = {
          geocode: function( address, cb ) {
            cb( null, [ { latitude: 2, longitude: 3 } ] );
          }
        };
        var mockCache = {
          geocodeCache: {}
        };
        revert = controller.__set__( 'geocoder', mockGeocode );
        var revertCache = controller.__set__( 'cache', mockCache );

        geocodeOneGroup( '1', '123 Main' )
        .then(function( gpx ) {
          var cache = controller.__get__( 'cache' );
          expect( cache.geocodeCache.hasOwnProperty( '1' ) ).toBe( true)
          expect( Array.isArray( cache.geocodeCache[ '1' ] ) ).toBe( true );
          expect( cache.geocodeCache[ '1' ][ 0 ] ).toBe( 2 );
          expect( cache.geocodeCache[ '1' ][ 1 ] ).toBe( 3 );
          revertCache();
          done();
        })
        .catch(function( error ) {
          expect( error ).toBe( 1 );
          done();
        });
      });

      it('should catch and reject with error', function( done ) {
        mockGeocode = {
          geocode: function( address, cb ) {
            cb( 'Test', null );
          }
        };
        spyOn( mockGeocode, 'geocode' ).andCallThrough();
        revert = controller.__set__( 'geocoder', mockGeocode );

        geocodeOneGroup( '1', '123 Main' )
        .catch(function( error ) {
          expect( mockGeocode.geocode ).toHaveBeenCalled();
          expect( mockGeocode.geocode.calls[ 0 ].args[ 0 ] ).toBe( '123 Main' );
          expect( error ).toBe( 'Test' );
          done();
        });
      });
    });

    describe('geocodeGroupsWithoutGPS', function() {
      var geocodeGroupsWithoutGPS = controller.geocodeGroupsWithoutGPS;

      it('should be defined as a function', function() {
        expect( typeof geocodeGroupsWithoutGPS ).toBe( 'function' );
      });
    });
  });
};