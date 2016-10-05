var Q = require( 'q' );
var json2csv = require( 'json2csv' );

exports.generateCSV = function( data, fieldsToInclude, prettyFieldTitles ) {
  var deferred = Q.defer();

  var options = {
    data: data
  };

  if ( fieldsToInclude ) {
    options.fields = fieldsToInclude;
  }

  if ( prettyFieldTitles ) {
    options.fieldNames = prettyFieldTitles;
  }

  json2csv(options, function( err, csv ) {
    if ( err )  {
      deferred.reject( err );
    } else {
      deferred.resolve( csv );
    }
  });

  return deferred.promise;
};