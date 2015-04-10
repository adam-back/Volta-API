var express = require('express');
var router = express.Router();

/* GET users listing. */
router.route('/')
  .get(function(req, res, next) {
    res.send('respond with a resource');
  });
router.route('/test')
  .get(function(req, res) {
    res.send('sdsadas');
  });

module.exports = router;
