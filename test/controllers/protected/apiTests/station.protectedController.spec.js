var supertest = require( 'supertest' );
var app = require( '../../../../server.js' );
var io = app.io;
app = app.app;
supertest = supertest( app );
var Q = require( 'q' );
var station = require( '../../../../models' ).station;
var plug = require( '../../../../models' ).plug;
var schedule = require( '../../../../models' ).media_schedule;
var appSponsorFactory = require( '../../../../factories/appSponsorFactory' );
var mediaScheduleFactory = require( '../../../../factories/media/mediaScheduleFactory.js' );
var createToken = require( '../../../jwtHelper' ).createToken;
var token = createToken();
var Sequelize = require( 'sequelize' );

module.exports = function() {
  describe('STATION ROUTES', function() {
    describe('station/', function() {
      var route = '/protected/station';

      describe('GET', function() {
        var stationFind;

        beforeEach(function() {
          stationFind = Q.defer();
          spyOn( station, 'findAll' ).andReturn( stationFind.promise );
        });

        it('should be a defined route (not 404)', function( done ) {
          stationFind.reject( new Error( 'Test' ) );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( res.statusCode ).not.toBe( 404 );
          })
          .end( done );
        });

        it('should return JSON of all stations', function( done ) {
          var stations = [ { id: 1 }, { id: 2 } ];
          stationFind.resolve( stations );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 200 )
          .expect( JSON.stringify( stations ) )
          .expect( 'Content-Type', /json/ )
          .expect(function( res ) {
            expect( station.findAll ).toHaveBeenCalled();
            expect( station.findAll ).toHaveBeenCalledWith();
          })
          .end( done );
        });

        it('should return 500 failure for error', function( done ) {
          stationFind.reject( new Error( 'Test' ) );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 500 )
          .expect( 'Content-Type', /text/ )
          .expect( 'Test' )
          .expect(function( res ) {
            expect( station.findAll ).toHaveBeenCalled();
          })
          .end( done );
        });
      });

      describe('POST', function() {
        var findOrCreateStation, associateStation;
        var body = {
          kin: '001-0001-001-01-K',
          location_address: '123 Main'
        };

        beforeEach(function(  ) {
          findOrCreateStation = Q.defer();
          associateStation = Q.defer();
          spyOn( station, 'findOrCreate' ).andReturn( findOrCreateStation.promise );
          spyOn( appSponsorFactory, 'associateStationWithAppSponsors' ).andReturn( associateStation.promise );
          spyOn( station, 'destroy' );
        });

        it('should be a defined route (not 404)', function( done ) {
          findOrCreateStation.reject( new Error( 'Test' ) );
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( res.statusCode ).not.toBe( 404 );
          })
          .end( done );
        });

        it('should findOrCreate a station', function( done ) {
          findOrCreateStation.reject( new Error( 'Test' ) );
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect( 500 )
          .expect( 'Test' )
          .expect(function( res ) {
            expect( station.findOrCreate ).toHaveBeenCalled();
            expect( station.findOrCreate ).toHaveBeenCalledWith( { where: { kin: '001-0001-001-01-K' }, defaults: body } );
            expect( station.destroy ).not.toHaveBeenCalled();
          })
          .end( done );
        });

        it('should return return false if found', function( done ) {
          body.id = 1;
          findOrCreateStation.resolve( body , false );
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect( 200 )
          .expect( JSON.stringify( { successfullyAddedStation: false } ) )
          .expect( 'Content-Type', /json/ )
          .expect(function( res ) {
            expect( appSponsorFactory.associateStationWithAppSponsors ).not.toHaveBeenCalled();
          })
          .end( done );
        });

        it('should associate station if created and return true', function( done ) {
          body.id = 1;
          findOrCreateStation.resolve( [ body, true ] );
          associateStation.resolve();
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect( 200 )
          .expect( JSON.stringify( { successfullyAddedStation: true } ) )
          .expect( 'Content-Type', /json/ )
          .expect(function( res ) {
            expect( appSponsorFactory.associateStationWithAppSponsors ).toHaveBeenCalled();
            expect( appSponsorFactory.associateStationWithAppSponsors ).toHaveBeenCalledWith( body );
          })
          .end( done );
        });

        it('should destroy station if error is thrown on associate', function( done ) {
          body.id = 1;
          findOrCreateStation.resolve( [ body, true ] );
          associateStation.reject( new Error( 'Test' ) );
          supertest.post( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect( 500 )
          .expect( 'Test' )
          .expect(function( res ) {
            expect( appSponsorFactory.associateStationWithAppSponsors ).toHaveBeenCalled();
            expect( appSponsorFactory.associateStationWithAppSponsors ).toHaveBeenCalledWith( body );
            expect( station.destroy ).toHaveBeenCalled();
            expect( station.destroy ).toHaveBeenCalledWith( { where: { id: 1 }, force: true } );
          })
          .end( done );
        });
      });

      describe('PATCH', function() {
        var body, findStation, stationToUpdate, stationSave, getMediaSchedule, replaceMediaSchedule, findValidationErrorStation;

        beforeEach(function() {
          body = {
            kin: '001-0001-001-01-K',
            changes: [ [ 'location', 'Volta', 'home' ], [ 'kin', '001-0001-001-01-K', '001-0001-001-02-K' ] ]
          };
          findStation = Q.defer();
          stationToUpdate = station.build( { id: 1, kin: '001-0001-001-01-K', location: 'Volta', 'front_display_pc_serial_number': 1 } );
          stationSave = Q.defer();
          getMediaSchedule = Q.defer();
          replaceMediaSchedule = Q.defer();
          findValidationErrorStation = Q.defer();
          spyOn( station, 'find' ).andCallFake(function( query ) {
            if ( query.hasOwnProperty( 'raw' ) ) {
              return findValidationErrorStation.promise;
            } else {
              return findStation.promise;
            }
          });
          spyOn( stationToUpdate, 'save' ).andReturn( stationSave.promise );
          spyOn( mediaScheduleFactory, 'getMediaScheduleByKinLocal' ).andReturn( getMediaSchedule.promise );
          spyOn( mediaScheduleFactory, 'replaceMediaScheduleLocal' ).andReturn( replaceMediaSchedule.promise );
        });

        it('should be a defined route (not 404)', function( done ) {
          findStation.reject( new Error( 'Test' ) );
          supertest.patch( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( res.statusCode ).not.toBe( 404 );
          })
          .end( done );
        });

        it('should find a station by kin', function( done ) {
          findStation.reject( new Error( 'Test' ) );
          supertest.patch( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect(function( res ) {
            expect( station.find ).toHaveBeenCalled();
            expect( station.find ).toHaveBeenCalledWith( { where: { kin: '001-0001-001-01-K' } } );
          })
          .end( done );
        });

        it('should update a station', function( done ) {
          findStation.resolve( stationToUpdate );
          stationSave.reject( new Error( 'Test' ) );
          supertest.patch( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect(function( res ) {
            expect( stationToUpdate.location ).toBe( 'home' );
            expect( stationToUpdate.save ).toHaveBeenCalled();
            expect( stationToUpdate.save ).toHaveBeenCalledWith();
          })
          .end( done );
        });

        describe('no need to update media schedule', function() {
          it('should return JSON of updated station', function( done ) {
            findStation.resolve( stationToUpdate );
            stationSave.resolve( stationToUpdate );
            supertest.patch( route )
            .set( 'Authorization', 'Bearer ' + token )
            .send( body )
            .expect( 200 )
            .expect( 'Content-Type', /json/ )
            .expect(function( res ) {
              stationToUpdate.location = 'home';
              expect( res.body ).toEqual( stationToUpdate.get( { plain: true } ) );
              expect( mediaScheduleFactory.getMediaScheduleByKinLocal ).not.toHaveBeenCalled();
              expect( mediaScheduleFactory.replaceMediaScheduleLocal ).not.toHaveBeenCalled();
            })
            .end( done );
          });
        });

        describe('need to update media schedule', function() {
          beforeEach(function() {
            body.changes.push( [ 'front_display_pc_serial_number', '1', 'A' ] );
          });

          it('should get the media schedule', function( done ) {
            findStation.resolve( stationToUpdate );
            stationSave.resolve( stationToUpdate );
            getMediaSchedule.reject( new Error( 'Test' ) );
            supertest.patch( route )
            .set( 'Authorization', 'Bearer ' + token )
            .send( body )
            .expect(function( res ) {
              expect( mediaScheduleFactory.getMediaScheduleByKinLocal ).toHaveBeenCalled();
              expect( mediaScheduleFactory.getMediaScheduleByKinLocal ).toHaveBeenCalledWith( '001-0001-001-01-K' );
            })
            .end( done );
          });

          it('should return JSON of updated station if no schedules', function( done ) {
            findStation.resolve( stationToUpdate );
            stationSave.resolve( stationToUpdate );
            getMediaSchedule.resolve( [] );
            supertest.patch( route )
            .set( 'Authorization', 'Bearer ' + token )
            .send( body )
            .expect( 200 )
            .expect( 'Content-Type', /json/ )
            .expect(function( res ) {
              stationToUpdate.location = 'home';
              stationToUpdate.front_display_pc_serial_number = 'A';
              expect( res.body ).toEqual( stationToUpdate.get( { plain: true } ) );
              expect( mediaScheduleFactory.replaceMediaScheduleLocal ).not.toHaveBeenCalled();
            })
            .end( done );
          });

          it('should return JSON of updated station after replacing media schedule if schedules found', function( done ) {
            var oldMediaSchedule = schedule.build( { serial_number: 1 } );
            findStation.resolve( stationToUpdate );
            stationSave.resolve( stationToUpdate );
            getMediaSchedule.resolve( [ oldMediaSchedule ] );
            replaceMediaSchedule.resolve();
            supertest.patch( route )
            .set( 'Authorization', 'Bearer ' + token )
            .send( body )
            .expect( 200 )
            .expect( 'Content-Type', /json/ )
            .expect(function( res ) {
              expect( mediaScheduleFactory.replaceMediaScheduleLocal ).toHaveBeenCalled();
              // instead of toHaveBeenCalledWith()
              expect( mediaScheduleFactory.replaceMediaScheduleLocal.calls[ 0 ].args[ 0 ].hasOwnProperty( 'id' ) ).toBe( false );
              expect( mediaScheduleFactory.replaceMediaScheduleLocal.calls[ 0 ].args[ 0 ].hasOwnProperty( 'deleted_at' ) ).toBe( false );
              expect( mediaScheduleFactory.replaceMediaScheduleLocal.calls[ 0 ].args[ 0 ].serial_number ).toBe( 'A' );
              stationToUpdate.location = 'home';
              stationToUpdate.front_display_pc_serial_number = 'A';
              expect( res.body ).toEqual( stationToUpdate.get( { plain: true } ) );
            })
            .end( done );
          });
        });

        it('should handle non-conflict-based errors', function( done ) {
          findStation.reject( new Error( 'Test' ) );
          supertest.patch( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect( 500 )
          .expect( 'Test' )
          .expect(function( res ) {
            expect( station.find ).toHaveBeenCalled();
            expect( station.find ).toHaveBeenCalledWith( { where: { kin: '001-0001-001-01-K' } } );
          })
          .end( done );
        });

        it('should handle Sequelize validation errors', function( done ) {
          findStation.resolve( stationToUpdate );
          var errorOptions = {
            message: 'Validation error',
            errors:
              [ { message: 'kin must be unique',
                type: 'unique violation',
                path: 'kin',
                value: '001-0001-001-02-K' }
              ],
            parent: true,
            fields: { kin: '001-0001-001-02-K' }
          };
          stationSave.reject( new Sequelize.UniqueConstraintError( errorOptions ) );
          findValidationErrorStation.resolve( { id: 2, kin: '001-0001-001-02-K' } );
          supertest.patch( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect( 409 )
          .expect( 'Content-Type', /json/ )
          .expect(function( res ) {
            var errorCopy = new Sequelize.UniqueConstraintError( errorOptions );
            errorCopy.duplicateStation = { id: 2, kin: '001-0001-001-02-K' };
            expect( res.body ).toEqual( JSON.parse( JSON.stringify( errorCopy ) ) );
          })
          .end( done );
        });

        it('should catch error when trying to find duplicate station', function( done ) {
          findStation.resolve( stationToUpdate );
          var errorOptions = {
            message: 'Validation error',
            errors:
              [ { message: 'kin must be unique',
                type: 'unique violation',
                path: 'kin',
                value: '001-0001-001-02-K' }
              ],
            parent: true,
            fields: { kin: '001-0001-001-02-K' }
          };
          stationSave.reject( new Sequelize.UniqueConstraintError( errorOptions ) );
          findValidationErrorStation.reject( new Error( 'Test' ) );
          supertest.patch( route )
          .set( 'Authorization', 'Bearer ' + token )
          .send( body )
          .expect( 500 )
          .expect( 'Content-Type', /text/ )
          .expect( 'Test' )
          .end( done );
        });
      });
    });

    describe('station/count', function() {
      describe('GET', function() {
        var countStations;
        var route = '/protected/station/count';

        beforeEach(function() {
          countStations = Q.defer();
          spyOn( station, 'count' ).andReturn( countStations.promise );
        });

        it('should be a defined route (not 404)', function( done ) {
          countStations.reject( new Error( 'Test' ) );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( res.statusCode ).not.toBe( 404 );
          })
          .end( done );
        });

        it('should return JSON of current station count', function( done ) {
          var currentCount = 159;
          countStations.resolve( currentCount );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 200 )
          .expect( 'Content-Type', /json/ )
          .expect( JSON.stringify( currentCount ) )
          .expect(function( res ) {
            expect( station.count ).toHaveBeenCalled();
            expect( station.count ).toHaveBeenCalledWith();
          })
          .end( done );
        });

        it('should return 500 error for failure', function( done ) {
          countStations.reject( new Error( 'Couldn\'t count all stations.' ) );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 500 )
          .expect( 'Couldn\'t count all stations.' )
          .expect(function( res ) {
            expect( station.count ).toHaveBeenCalled();
            expect( station.count ).toHaveBeenCalledWith();
          })
          .end( done );
        });
      });
    });

    describe('station/:kin', function() {
      var route = '/protected/station/001-0001-001-01-K';

      describe('GET', function() {
        var findStation;

        beforeEach(function() {
          findStation = Q.defer();
          spyOn( station, 'findOne' ).andReturn( findStation.promise );
        });

        it('should be a defined route (not 404)', function( done ) {
          findStation.reject( new Error( 'Test' ) );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( res.statusCode ).not.toBe( 404 );
          })
          .end( done );
        });

        it('should find one station by kin', function( done ) {
          findStation.reject( new Error( 'Test' ) );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( station.findOne ).toHaveBeenCalled();
            expect( station.findOne ).toHaveBeenCalledWith( { where: { kin: '001-0001-001-01-K' } } );
          })
          .end( done );
        });

        it('should return 404 if no station found', function( done ) {
          findStation.resolve( [] );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 404 )
          .expect( '<p>A station with that KIN was not found.</p>' )
          .end( done );
        });

        it('should return JSON of station', function( done ) {
          var thatOneStation = [ { id: 1 } ];
          findStation.resolve( thatOneStation );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 200 )
          .expect( JSON.stringify( thatOneStation ) )
          .expect( 'Content-Type', /json/ )
          .end( done );
        });

        it('should return 500 failure for error', function( done ) {
          findStation.reject( new Error( 'Test' ) );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 500 )
          .expect( 'Content-Type', /text/ )
          .expect( 'Test' )
          .end( done );
        });
      });

      describe('DELETE', function() {
        var foundStation, plug1, plug2;
        var findOneStation, getStationsPlugs, plug1Destroy, plug2Destroy, removeStationSponsor, stationDestroy;

        beforeEach(function(  ) {
          foundStation = station.build( { id: 1, kin: '001-0001-001-01-K' } );
          plug1 = plug.build( { id: 1, number_on_station: 1 } );
          plug2 = plug.build( { id: 2, number_on_station: 2 } );
          foundStation.addPlugs( [ plug1, plug2 ] );

          findOneStation = Q.defer();
          getStationsPlugs = Q.defer();
          plug1Destroy = Q.defer();
          plug2Destroy = Q.defer();
          removeStationSponsor = Q.defer();
          stationDestroy = Q.defer();

          spyOn( station, 'findOne' ).andReturn( findOneStation.promise );
          spyOn( foundStation, 'getPlugs' ).andReturn( getStationsPlugs.promise );
          spyOn( plug1, 'destroy' ).andReturn( plug1Destroy.promise );
          spyOn( plug2, 'destroy' ).andReturn( plug2Destroy.promise );
          spyOn( appSponsorFactory, 'removeAssociationBetweenStationAndAppSponsors' ).andReturn( removeStationSponsor.promise );
          spyOn( foundStation, 'destroy' ).andReturn( stationDestroy.promise );
        });

        it('should be a defined route (not 404)', function( done ) {
          findOneStation.reject( new Error( 'Test' ) );
          supertest.get( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( res.statusCode ).not.toBe( 404 );
          })
          .end( done );
        });

        it('should find one station by kin', function( done ) {
          findOneStation.reject( new Error( 'Test' ) );
          supertest.delete( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( station.findOne ).toHaveBeenCalled();
            expect( station.findOne ).toHaveBeenCalledWith( { where: { kin: '001-0001-001-01-K' } } );
          })
          .end( done );
        });

        it('should get all plugs for station', function( done ) {
          findOneStation.resolve( foundStation );
          getStationsPlugs.reject( new Error( 'Test' ) );
          supertest.delete( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( foundStation.getPlugs ).toHaveBeenCalled();
            expect( foundStation.getPlugs ).toHaveBeenCalledWith();
          })
          .end( done );
        });

        it('should destroy associated plugs', function( done ) {
          findOneStation.resolve( foundStation );
          getStationsPlugs.resolve( [ plug1, plug2 ] );
          plug1Destroy.resolve();
          plug2Destroy.resolve();
          removeStationSponsor.reject( new Error( 'Test' ) );
          supertest.delete( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( plug1.destroy ).toHaveBeenCalled();
            expect( plug1.destroy ).toHaveBeenCalledWith();
            expect( plug2.destroy ).toHaveBeenCalled();
            expect( plug2.destroy ).toHaveBeenCalledWith();
          })
          .end( done );
        });

        it('should skip destroying plugs if there aren\'t any', function( done ) {
          findOneStation.resolve( foundStation );
          getStationsPlugs.resolve( [] );
          removeStationSponsor.reject( new Error( 'Test' ) );
          supertest.delete( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( plug1.destroy ).not.toHaveBeenCalled();
            expect( plug2.destroy ).not.toHaveBeenCalled();
          })
          .end( done );
        });

        it('should remove association between station and app sponsors', function( done ) {
          findOneStation.resolve( foundStation );
          getStationsPlugs.resolve( [] );
          removeStationSponsor.resolve( foundStation );
          stationDestroy.reject( new Error( 'Test' ) );
          supertest.delete( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect(function( res ) {
            expect( appSponsorFactory.removeAssociationBetweenStationAndAppSponsors ).toHaveBeenCalled();
            expect( appSponsorFactory.removeAssociationBetweenStationAndAppSponsors ).toHaveBeenCalledWith( foundStation );
          })
          .end( done );
        });

        it('should destroy station, then return 204', function( done ) {
          findOneStation.resolve( foundStation );
          getStationsPlugs.resolve( [] );
          removeStationSponsor.resolve( foundStation );
          stationDestroy.resolve();
          supertest.delete( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 204 )
          .expect(function( res ) {
            expect( foundStation.destroy ).toHaveBeenCalled();
            expect( foundStation.destroy ).toHaveBeenCalledWith();
          })
          .end( done );
        });

        it('should return 404 if no station found', function( done ) {
          findOneStation.resolve( [] );
          supertest.delete( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 404 )
          .expect( 'Station with that KIN not found in database. Could not be deleted.' )
          .end( done );
        });

        it('should return 500 failure for error', function( done ) {
          findOneStation.reject( new Error( 'Test' ) );
          supertest.delete( route )
          .set( 'Authorization', 'Bearer ' + token )
          .expect( 500 )
          .expect( 'Content-Type', /text/ )
          .expect( 'Error deleting station: Test' )
          .end( done );
        });
      });
    });
  });
};