var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  // previously we just render the index.html
  //res.render('index', { title: 'Express' });
  // now we redirect it to "/catalog"
  res.redirect('/catalog');
});

module.exports = router;
