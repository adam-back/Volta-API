var config    = require( '../../../../config/config' ).development;
var Q = require( 'q' );
var async     = require( 'async' );
var models = require( '../../../../models' );
var controller = require( '../../../../controllers/protected/app.protectedController.js' );
var geocodeCache = require( '../../../../factories/geocodeCache.js' ).geocodeCache;
var distance = require( '../../../../factories/distanceFactory.js' );
var geocoder = require( 'node-geocoder' )( 'google', 'https', { apiKey: config.googleApiKey, formatter: null } );

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

      it('should be defined as a function', function() {
        expect( typeof groupByKin ).toBe( 'function' );
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