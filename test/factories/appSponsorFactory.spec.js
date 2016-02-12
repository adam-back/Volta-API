var async = require( 'async' );
var Q = require( 'q' );
var app_sponsor = require( '../../models' ).app_sponsor;
var station = require( '../../models' ).station;
var factory = require( '../../factories/appSponsorFactory' );

describe('appSponsorFactory.js', function() {
  describe('associateStationWithAppSponsors', function() {
    var associateStationWithAppSponsors = factory.associateStationWithAppSponsors;
    var findSponsors, countStations, associateStationWithSponsor;
    var stationToAssociate = { id: 42 };
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
});