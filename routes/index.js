var express = require('express');
var unirest = require('unirest');

var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});


/* GET some content from an external API provider */
router.get('/movies', function(req,res) {
   
   var onconnect_api_key = req.app.locals.onconnect_api_key;
   /* console.log('api key 2 ' + onconnect_api_key); */

   res.render('movies', { title: 'Movies in Theatres' });


   unirest.get('http://data.tmsapi.com/v1.1/movies/showings?startDate=2016-06-20&zip=94063&api_key=' + onconnect_api_key)
   .headers({'Accept': 'application/json', 'Content-Type': 'application/json'})
   .end(function (response) {
	console.log(response.body);
  });
});

module.exports = router;
