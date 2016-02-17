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
      // build creates instances but does not persist without .save
      sponsor1 = app_sponsor.build( { company: 'Chevy', station_query: { where: { station_id: 42 } } } );
      sponsor2 = app_sponsor.build( { company: 'Volta' } );
      sponsors.push( sponsor1 );
      sponsors.push( sponsor2 );
      stationToAssociate = station.build( { id: 42 } );
      findSponsors = Q.defer();
      countStations = Q.defer();
      associateStationWithSponsor = Q.defer();
      spyOn( app_sponsor, 'findAll' ).andReturn( findSponsors.promise );
      spyOn( async, 'each' ).andCallThrough();
      spyOn( station, 'count' ).andReturn( countStations.promise );
      spyOn( sponsor1, 'addStation' ).andReturn( associateStationWithSponsor.promise );
    });

    afterEach(function() {
      sponsors = [];
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

    it('should find all app sponsors and loop through them', function( done ) {
      findSponsors.resolve( sponsors );
      countStations.reject();
      associateStationWithAppSponsors()
      .catch(function( error ) {
        expect( app_sponsor.findAll ).toHaveBeenCalled();
        expect( app_sponsor.findAll ).toHaveBeenCalledWith();
        expect( async.each ).toHaveBeenCalled();
        expect( async.each.calls[ 0 ].args[ 0 ] ).toEqual( sponsors );
        done();
      });
    });

    it('should not check to associate if sponsor has no query', function( done ) {
      sponsors.shift();
      findSponsors.resolve( sponsors );
      associateStationWithAppSponsors( stationToAssociate )
      .then(function() {
        expect( station.count ).not.toHaveBeenCalled();
        done();
      })
      .catch(function( error ) {
        expect( error ).toBe( 1 );
        done();
      });
    });

    it('should check if station should associate with sponsor', function( done ) {
      sponsors.pop();
      findSponsors.resolve( sponsors );
      countStations.reject( 'Fake reject' );
      associateStationWithAppSponsors( stationToAssociate )
      .catch(function( error ) {
        expect( station.count ).toHaveBeenCalled();
        expect( station.count ).toHaveBeenCalledWith( sponsors[ 0 ].station_query );
        done();
      });
    });

    it('should associate if sponsor matches station', function( done ) {
      sponsors.pop();
      findSponsors.resolve( sponsors );
      countStations.resolve( 1 );
      associateStationWithSponsor.resolve();
      associateStationWithAppSponsors( stationToAssociate )
      .then(function( result ) {
        expect( station.count ).toHaveBeenCalled();
        expect( station.count.calls.length ).toBe( 1 );
        expect( result ).toBeUndefined();
        expect( sponsor1.addStation ).toHaveBeenCalled();
        expect( sponsor1.addStation ).toHaveBeenCalledWith( stationToAssociate );
        done();
      })
      .catch(function( error ) {
        expect( error ).toBe( 1 );
        done();
      });
    });

    it('should not associate if sponsor doens\'t matche station', function( done ) {
      sponsors.pop();
      findSponsors.resolve( sponsors );
      countStations.resolve( 0 );
      associateStationWithSponsor.resolve();
      associateStationWithAppSponsors( stationToAssociate )
      .then(function( result ) {
        expect( station.count ).toHaveBeenCalled();
        expect( station.count.calls.length ).toBe( 1 );
        expect( result ).toBeUndefined();
        expect( sponsor1.addStation ).not.toHaveBeenCalled();
        done();
      })
      .catch(function( error ) {
        expect( error ).toBe( 1 );
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