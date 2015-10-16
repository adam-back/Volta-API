var Q = require( 'q' );
var json2csv = require( 'json2csv' );

exports.generateCSV = function( data, fieldsToInclude, prettyFieldTitles ) {
  var deferred = Q.defer();

  json2csv({ data: data, fields: fieldsToInclude, fieldNames: prettyFieldTitles }, function( err, csv ) {
    if ( err )  {
      deferred.reject( err );
    } else {
      deferred.resolve( csv );
    }
  });

  return deferred.promise;
};