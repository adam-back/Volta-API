var async = require( 'async' );
var Q = require( 'q' );
var app_sponsor = require( '../../models' ).app_sponsor;
var station = require( '../../models' ).station;
var factory = require( '../../factories/appSponsorFactory' );

describe('appSponsorFactory.js', function() {
  describe('associateStationWithAppSponsors', function() {
    var associateStationWithAppSponsors = factory.associateStationWithAppSponsors;
    var sponsor1, sponsor2, stationToAssociate;
    var findSponsors, countStations, sponsor2promise;
    var sponsors = [];

    beforeEach(function() {
      // todo: create sponsors with sequelize so that they have addStation methods to spy on, 
      // but which do not actually save in a db
      // sponsors.push( app_sponsor.create( { station_query: { where: { station_id: 42 } } } ) );
      findSponsors = Q.defer();
      countStations = Q.defer();
      associateStationWithSponsor = Q.defer();
      spyOn( app_sponsor, 'findAll' ).andReturn( findSponsors.promise );
      spyOn( async, 'each' ).andCallThrough();
      spyOn( station, 'count' ).andReturn( countStations.promise );
      // spyOn( sponsor, 'addStation' ).andReturn( associateStationWithSponsor.promise );
    });

    it('should be defined as a function', function() {
      expect( typeof associateStationWithAppSponsors ).toBe( 'function' );
    });

    it('should find all the app sponsors, but reject if there aren\'t any', function( done ) {
      findSponsors.resolve( [] );
      associateStationWithAppSponsors()
      .catch(function( error ) {
        expect( app_sponsor.findAll ).toHaveBeenCalled();
        expect( app_sponsor.findAll ).toHaveBeenCalledWith();
        expect( error.message ).toBe( 'No sponsors found.' );
        done();
      });
    });

    xit('should find all the app sponsors and loop through them', function( done ) {
      findSponsors.resolve( sponsors );
      associateStationWithAppSponsors()
      .catch(function( error ) {
        expect( app_sponsor.findAll ).toHaveBeenCalled();
        expect( app_sponsor.findAll ).toHaveBeenCalledWith();
        expect( error.message ).toBe( 'No sponsors found.' );
        done();
      });
    });
  });

  describe('removeAssociationBetweenStationAndAppSponsors', function() {
    var removeAssociationBetweenStationAndAppSponsors = factory.removeAssociationBetweenStationAndAppSponsors;
    var stationToRemove, appSponsors, sponsor1, sponsor2;
    var stationPromise, sponsor1promise, sponsor2promise;

    beforeEach(function() {
      stationPromise = Q.defer();
      sponsor1promise = Q.defer();
      sponsor2promise = Q.defer();
      // mock fns
      stationToRemove = {
        getAppSponsors: function() {
          return void( 0 );
        }
      };
      sponsor1 = {
        removeStation: function() {
          return void( 0 );
        }
      };
      sponsor2 = {
        removeStation: function() {
          return void( 0 );
        }
      };
      spyOn( stationToRemove, 'getAppSponsors' ).andReturn( stationPromise.promise );
      spyOn( sponsor1, 'removeStation' ).andReturn( sponsor1promise.promise );
      spyOn( sponsor2, 'removeStation' ).andReturn( sponsor2promise.promise );
      appSponsors = [ sponsor1, sponsor2 ];
    });

    it('should be defined as a function', function() {
      expect( typeof removeAssociationBetweenStationAndAppSponsors ).toBe( 'function' );
    });

    it('should get all app sponsors', function( done ) {
      stationPromise.reject();
      removeAssociationBetweenStationAndAppSponsors( stationToRemove )
      .catch(function( error ) {
        expect( stationToRemove.getAppSponsors ).toHaveBeenCalled();
        expect( stationToRemove.getAppSponsors ).toHaveBeenCalledWith();
        done();
      });
    });

    it('should return the station if no app sponsors are found', function( done ) {
      stationPromise.resolve( [] );
      removeAssociationBetweenStationAndAppSponsors( stationToRemove )
      .then(function( result ) {
        expect( result ).toEqual( stationToRemove );
        expect( sponsor1.removeStation ).not.toHaveBeenCalled();
        done();
      })
      .catch(function( error ) {
        expect( error ).toBe( 1 );
        done();
      });
    });

    it('should removeStation() for each sponsor', function( done ) {
      stationPromise.resolve( appSponsors );
      sponsor1promise.resolve();
      sponsor2promise.resolve();

      removeAssociationBetweenStationAndAppSponsors( stationToRemove )
      .then(function( result ) {
        expect( result ).toEqual( stationToRemove );
        expect( sponsor1.removeStation ).toHaveBeenCalled();
        expect( sponsor1.removeStation ).toHaveBeenCalledWith( stationToRemove );
        expect( sponsor2.removeStation ).toHaveBeenCalled();
        expect( sponsor2.removeStation ).toHaveBeenCalledWith( stationToRemove );
        done();
      })
      .catch(function( error ) {
        expect( error ).toBe( 1 );
        done();
      });
    });
  });
});