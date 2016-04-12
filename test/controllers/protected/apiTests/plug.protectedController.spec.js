var models = require( '../../../../models');
var Q = require( 'q' );
var supertest = require( 'supertest' );
var app = require( '../../../../server.js' ).app;
supertest = supertest( app );

var createToken = require( '../../../jwtHelper' ).createToken;
var token = createToken();

module.exports = function() {
  describe('PLUG ROUTES', function() {
    describe('plug/', function() {
      var route = '/protected/plug';

      describe('GET', function() {
        var plugFind;

        beforeEach(function() {
          plugFind = Q.defer();
          spyOn( models.plug, 'findAll' ).andReturn( plugFind.promise );
        });

        it('should be a defined route (not 404)', function( done ) {
          plugFind.reject( new Error( 'Test' ) );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( res.statusCode ).not.toBe( 404 );
          })
          .end( done );
        });

        it('should find all the plugs', function( done ) {
          plugFind.reject( new Error( 'Test' ) );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( models.plug.findAll ).toHaveBeenCalled();
            expect( models.plug.findAll ).toHaveBeenCalledWith( { raw: true } );
          })
          .end( done );
        });

        it('should return JSON of plugs ordered by station_id', function( done ) {
          plugFind.resolve( [ { id: 1, station_id: 1 }, { id: 3, station_id: 4 }, { id: 2, station_id: 1 } ] );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 200 )
          .expect( 'Content-Type', /json/ )
          .expect(function( res ) {
            expect( typeof res.body ).toBe( 'object' );
            expect( Array.isArray( res.body ) ).toBe( false );
            expect( res.body[ '1' ] ).toEqual( [ { id: 1, station_id: 1 }, { id: 2, station_id: 1 } ] );
            expect( res.body[ '2' ] ).not.toBeDefined();
            expect( res.body[ '3' ] ).not.toBeDefined();
            expect( res.body[ '4' ] ).toEqual( [ { id: 3, station_id: 4 } ] );
          })
          .end( done );
        });

        it('should return 500 failure for error', function( done ) {
          plugFind.reject( new Error( 'Test' ) );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 500 )
          .expect( 'Content-Type', /text/ )
          .expect( 'Test' )
          .expect(function( res ) {
            expect( models.plug.findAll ).toHaveBeenCalled();
          })
          .end( done );
        });
      });

      describe('POST', function() {
        var body, findStation, foundStation, findOrCreatePlug, foundPlug, associatePlug;

        beforeEach(function() {
          body = {
            kin: '001-0001-001-01-K',
            ekm_omnimeter_serial: 'A'
          };
          findStation = Q.defer();
          foundStation = models.station.build( { kin: '001-0001-001-01-K' } );
          findOrCreatePlug = Q.defer();
          foundPlug = { id: 1 };
          associatePlug = Q.defer();
          spyOn( models.station, 'findOne' ).andReturn( findStation.promise );
          spyOn( models.plug, 'findOrCreate' ).andReturn( findOrCreatePlug.promise );
          spyOn( foundStation, 'addPlug' ).andReturn( associatePlug.promise );
        });

        it('should be a defined route (not 404)', function( done ) {
          findStation.reject( new Error( 'Test' ) );
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect(function( res ) {
            expect( res.statusCode ).not.toBe( 404 );
          })
          .end( done );
        });

        it('should find one station by kin', function( done ) {
          findStation.reject( new Error( 'Test' ) );
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect(function( res ) {
            expect( models.station.findOne ).toHaveBeenCalled();
            expect( models.station.findOne ).toHaveBeenCalledWith( { where: { kin: '001-0001-001-01-K' } } );
          })
          .end( done );
        });

        it('should send 500 if no station found by kin', function( done ) {
          findStation.resolve( null );
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect( 500 )
          .expect( 'Content-Type', /text/ )
          .expect( 'No station found for kin 001-0001-001-01-K' )
          .expect(function( res ) {
            expect( models.plug.findOrCreate ).not.toHaveBeenCalled();
          })
          .end( done );
        });

        it('should find or create plug', function( done ) {
          findStation.resolve( foundStation );
          findOrCreatePlug.reject( new Error( 'Test' ) );
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect(function( res ) {
            expect( models.plug.findOrCreate ).toHaveBeenCalled();
            expect( models.plug.findOrCreate ).toHaveBeenCalledWith( { where: { ekm_omnimeter_serial: 'A' }, defaults: { ekm_omnimeter_serial: 'A' } } );
          })
          .end( done );
        });

        it('should associate plug if created', function( done ) {
          findStation.resolve( foundStation );
          findOrCreatePlug.resolve( [ foundPlug, true ] );
          associatePlug.reject( new Error( 'Test' ) );
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect(function( res ) {
            expect( foundStation.addPlug ).toHaveBeenCalled();
            expect( foundStation.addPlug ).toHaveBeenCalledWith( foundPlug );
          })
          .end( done );
        });

        it('should throw 409 if plug not created', function( done ) {
          findStation.resolve( foundStation );
          findOrCreatePlug.resolve( [ foundPlug, false ] );
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect( 409 )
          .expect( 'Content-Type', /json/ )
          .expect( foundPlug )
          .expect(function( res ) {
            expect( foundStation.addPlug ).not.toHaveBeenCalled();
          })
          .end( done );
        });

        it('should send success boolean on creation', function( done ) {
          findStation.resolve( foundStation );
          findOrCreatePlug.resolve( [ foundPlug, true ] );
          associatePlug.resolve();
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect( 200 )
          .expect( 'Content-Type', /json/ )
          .expect( { successfullyAddedPlug: true } )
          .end( done );
        });

        it('should return 500 failure for error', function( done ) {
          findStation.reject( new Error( 'Test' ) );
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect( 500 )
          .expect( 'Content-Type', /text/ )
          .expect( 'Test' )
          .expect(function( res ) {
            expect( models.station.findOne ).toHaveBeenCalled();
          })
          .end( done );
        });
      });

      describe('PATCH', function() {
        var body, checkPlugEkm, findPlug, foundPlug, savePlug;

        beforeEach(function() {
          body = {
            serialNumber: 'A',
            id: 1,
            changes: [ [ 'charger_type', 2, 3 ] ]
          };
          checkPlugEkm = Q.defer();
          findPlug = Q.defer();
          foundPlug = models.plug.build( { ekm_omnimeter_serial: 'A', charger_type: 2 } );
          savePlug = Q.defer();
          spyOn( models.plug, 'findOne' ).andCallFake(function( query ) {
            if ( query.hasOwnProperty( 'raw' ) ) {
              return checkPlugEkm.promise;
            } else {
              return findPlug.promise;
            }
          });
          spyOn( foundPlug, 'save' ).andReturn( savePlug.promise );
        });

        it('should be a defined route (not 404)', function( done ) {
          checkPlugEkm.reject( new Error( 'Test' ) );
          supertest.patch( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect(function( res ) {
            expect( res.statusCode ).not.toBe( 404 );
          })
          .end( done );
        });

        it('should check if patch will violate unique omnimeter constraint', function( done ) {
          checkPlugEkm.reject( new Error( 'Test' ) );
          supertest.patch( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect(function( res ) {
            expect( models.plug.findOne ).toHaveBeenCalled();
            expect( models.plug.findOne ).toHaveBeenCalledWith( { where: { ekm_omnimeter_serial: 'A', id: { $ne: 1 } }, raw: true } );
          })
          .end( done );
        });

        it('should reject 409 if plug violates unique omnimeter', function( done ) {
          checkPlugEkm.resolve( { id: 1 } );
          supertest.patch( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect( 409 )
          .expect( 'Content-Type', /json/ )
          .expect( { title: 'Duplicate Error', message: 'There was already plug with the same omnimeter serial number.', duplicateId: 1 } )
          .expect(function( res ) {
            expect( models.plug.findOne.calls.length ).toBe( 1 );
          })
          .end( done );
        });

        it('should findOne plug by id to update', function( done ) {
          checkPlugEkm.resolve( null );
          findPlug.reject( new Error( 'Test' ) );
          supertest.patch( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect(function( res ) {
            expect( models.plug.findOne.calls.length ).toBe( 2 );
            expect( models.plug.findOne.calls[ 1 ].args[ 0 ] ).toEqual( { where: { id: 1 } } );
          })
          .end( done );
        });

        it('should update the plug with changes', function( done ) {
          checkPlugEkm.resolve( null );
          findPlug.resolve( foundPlug );
          savePlug.reject( new Error( 'Test' ) );
          supertest.patch( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect(function( res ) {
            expect( foundPlug.save ).toHaveBeenCalled();
            expect( foundPlug.save ).toHaveBeenCalledWith();
            expect( foundPlug.get( { plain: true } ) ).toEqual( { id: null, ekm_omnimeter_serial: 'A', charger_type: 3 } );
          })
          .end( done );
        });

        it('should resolve 204 on success', function( done ) {
          checkPlugEkm.resolve( null );
          findPlug.resolve( foundPlug );
          savePlug.resolve();
          supertest.patch( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect( 204 )
          .expect( '' )
          .end( done );
        });

        it('should return 500 failure for error', function( done ) {
          checkPlugEkm.reject( new Error( 'Test' ) );
          supertest.patch( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect( 500 )
          .expect( 'Content-Type', /text/ )
          .expect( 'Test' )
          .expect(function( res ) {
            expect( models.plug.findOne ).toHaveBeenCalled();
          })
          .end( done );
        });
      });
    });

    describe('plug/:id', function() {
      var route = '/protected/plug/42';

      describe('GET', function() {
        var plugFind;

        beforeEach(function() {
          plugFind = Q.defer();
          spyOn( models.plug, 'findOne' ).andReturn( plugFind.promise );
        });

        it('should be a defined route (not 404)', function( done ) {
          plugFind.reject( new Error( 'Test' ) );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( res.statusCode ).not.toBe( 404 );
          })
          .end( done );
        });

        it('should find plug by id', function( done ) {
          plugFind.reject( new Error( 'Test' ) );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( models.plug.findOne ).toHaveBeenCalled();
            expect( models.plug.findOne ).toHaveBeenCalledWith( { where: { id: 42 }, raw: true } );
          })
          .end( done );
        });

        it('should return JSON of found plug', function( done ) {
          plugFind.resolve( { id: 1, station_id: 1 } );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 200 )
          .expect( 'Content-Type', /json/ )
          .expect(function( res ) {
            expect( typeof res.body ).toBe( 'object' );
            expect( Array.isArray( res.body ) ).toBe( false );
            expect( res.body ).toEqual( { id: 1, station_id: 1 } );
          })
          .end( done );
        });

        it('should return 404 if no plug found', function( done ) {
          plugFind.resolve( null );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 404 )
          .expect( 'Content-Type', /text/ )
          .expect( 'Plug with that id not found in database.' )
          .end( done );
        });

        it('should return 500 failure for error', function( done ) {
          plugFind.reject( new Error( 'Test' ) );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 500 )
          .expect( 'Content-Type', /text/ )
          .expect( 'Test' )
          .expect(function( res ) {
            expect( models.plug.findOne ).toHaveBeenCalled();
          })
          .end( done );
        });
      });

      describe('DELETE', function() {
        var plugFind, foundPlug, stationFind, foundStation, disassociatePlug, destroyPlug, updateStation, getAssociatedPlugs, plug2, plug3, decrementPlug;

        beforeEach(function() {
          plugFind = Q.defer();
          // middle of the plugs
          foundPlug = models.plug.build( { id: 2, number_on_station: 2, station_id: 2 } );
          stationFind = Q.defer();
          foundStation = models.station.build( { id: 2, in_use: [ 'true', 'false', 'false' ] } );
          disassociatePlug = Q.defer();
          destroyPlug = Q.defer();
          updateStation = Q.defer();
          getAssociatedPlugs = Q.defer();
          // first plug should not decrement
          plug1 = models.plug.build( { id: 1, number_on_station: 1, station_id: 2 } );
          // third plug should drop to 2
          plug3 = models.plug.build( { id: 3, number_on_station: 3, station_id: 2 } );
          decrementPlug = Q.defer();

          spyOn( models.plug, 'findOne' ).andReturn( plugFind.promise );
          spyOn( models.station, 'findOne' ).andReturn( stationFind.promise );
          spyOn( foundStation, 'removePlug' ).andReturn( disassociatePlug.promise );
          spyOn( foundPlug, 'destroy' ).andReturn( destroyPlug.promise );
          spyOn( foundStation, 'update' ).andReturn( updateStation.promise );
          spyOn( foundStation, 'getPlugs' ).andReturn( getAssociatedPlugs.promise );
          spyOn( plug1, 'decrement' );
          spyOn( plug3, 'decrement' ).andReturn( decrementPlug.promise );

        });

        it('should be a defined route (not 404)', function( done ) {
          plugFind.reject( new Error( 'Test' ) );
          supertest.delete( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( res.statusCode ).not.toBe( 404 );
          })
          .end( done );
        });

        it('should find plug by id', function( done ) {
          plugFind.reject( new Error( 'Test' ) );
          supertest.delete( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( models.plug.findOne ).toHaveBeenCalled();
            expect( models.plug.findOne ).toHaveBeenCalledWith( { where: { id: 42 } } );
          })
          .end( done );
        });

        it('should throw 404 error if no plug is found', function( done ) {
          plugFind.resolve( null );
          supertest.delete( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 404 )
          .expect( 'Content-Type', /text/ )
          .expect( 'A plug with that id could not be found' )
          .expect(function( res ) {
            expect( models.plug.findOne ).toHaveBeenCalled();
            expect( models.plug.findOne ).toHaveBeenCalledWith( { where: { id: 42 } } );
          })
          .end( done );
        });

        it('should find plug\'s station', function( done ) {
          plugFind.resolve( foundPlug );
          stationFind.reject( new Error( 'Test' ) );
          supertest.delete( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( models.station.findOne ).toHaveBeenCalled();
            expect( models.station.findOne ).toHaveBeenCalledWith( { where: { id: 2 } } );
          })
          .end( done );
        });

        it('should throw error if no station found', function( done ) {
          plugFind.resolve( foundPlug );
          stationFind.resolve( null );
          supertest.delete( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 500 )
          .expect( 'Content-Type', /text/ )
          .expect( 'There is no station association for plug 2' )
          .end( done );
        });

        it('should disassociate plug from station', function( done ) {
          plugFind.resolve( foundPlug );
          stationFind.resolve( foundStation );
          disassociatePlug.reject( new Error( 'Test' ) );
          supertest.delete( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( foundStation.removePlug ).toHaveBeenCalled();
            expect( foundStation.removePlug ).toHaveBeenCalledWith( foundPlug );
          })
          .end( done );
        });

        it('should destroy plug', function( done ) {
          plugFind.resolve( foundPlug );
          stationFind.resolve( foundStation );
          disassociatePlug.resolve();
          destroyPlug.reject( new Error( 'Test' ) );
          supertest.delete( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( foundPlug.destroy ).toHaveBeenCalled();
            expect( foundPlug.destroy ).toHaveBeenCalledWith();
          })
          .end( done );
        });

        it('should update station in_use', function( done ) {
          plugFind.resolve( foundPlug );
          stationFind.resolve( foundStation );
          disassociatePlug.resolve();
          destroyPlug.resolve();
          updateStation.reject( new Error( 'Test' ) );
          supertest.delete( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( foundStation.update ).toHaveBeenCalled();
            expect( foundStation.update ).toHaveBeenCalledWith( { in_use: [ 'true', 'false' ] } );
          })
          .end( done );
        });

        it('should make station in_use null if removing only plug', function( done ) {
          plugFind.resolve( foundPlug );
          foundPlug.number_on_station = 1;
          foundStation.in_use = [ 'true' ];
          stationFind.resolve( foundStation );
          disassociatePlug.resolve();
          destroyPlug.resolve();
          updateStation.reject( new Error( 'Test' ) );
          supertest.delete( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( foundStation.update ).toHaveBeenCalled();
            expect( foundStation.update ).toHaveBeenCalledWith( { in_use: null } );
          })
          .end( done );
        });

        it('should get associated plugs for station', function( done ) {
          plugFind.resolve( foundPlug );
          stationFind.resolve( foundStation );
          disassociatePlug.resolve();
          destroyPlug.resolve();
          updateStation.resolve( foundStation );
          getAssociatedPlugs.reject( new Error( 'Test' ) );
          supertest.delete( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( foundStation.getPlugs ).toHaveBeenCalled();
            expect( foundStation.getPlugs ).toHaveBeenCalledWith();
          })
          .end( done );
        });

        it('should adjust plug.number_on_station downward for deleted plug', function( done ) {
          plugFind.resolve( foundPlug );
          stationFind.resolve( foundStation );
          disassociatePlug.resolve();
          destroyPlug.resolve();
          updateStation.resolve( foundStation );
          getAssociatedPlugs.resolve( [ plug1, plug3 ] );
          decrementPlug.reject( new Error( 'Test' ) );

          supertest.delete( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( plug1.decrement ).not.toHaveBeenCalled();
            expect( plug3.decrement ).toHaveBeenCalled();
            expect( plug3.decrement ).toHaveBeenCalledWith( 'number_on_station' );
          })
          .end( done );
        });

        it('should not adjust number_on_station if no plugs', function( done ) {
          plugFind.resolve( foundPlug );
          stationFind.resolve( foundStation );
          disassociatePlug.resolve();
          destroyPlug.resolve();
          updateStation.resolve( foundStation );
          getAssociatedPlugs.resolve( [] );
          spyOn( Q, 'all' );
          supertest.delete( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( Q.all ).not.toHaveBeenCalled();
          })
          .end( done );
        });

        it('should resolve 204 on success', function( done ) {
          plugFind.resolve( foundPlug );
          stationFind.resolve( foundStation );
          disassociatePlug.resolve();
          destroyPlug.resolve();
          updateStation.resolve( foundStation );
          getAssociatedPlugs.resolve( [] );

          supertest.delete( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 204 )
          .expect( '' )
          .end( done );
        });
      });
    });
  });
};