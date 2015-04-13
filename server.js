var child_process = require('child_process');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var ekmRoutes = require('./routes/ekmRoutes');

var app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/ekm', ekmRoutes);

app.get('*', function(req, res){
  res.send('I\'m afraid I can\'t do that, Hal', 404);
});

module.exports = app;

child_process.exec('./bin/www');
 