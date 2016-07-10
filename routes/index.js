var express = require('express');
var unirest = require('unirest');

var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

function fetchMoviesIntoDB(zip, req, res, cb) {

   var zipcode = zip;

   /* set our internal DB variable */
   var db = req.db;
   var movie_collection = db.get('local_movies');
   var d = new Date();
   var dd = d.getDate();
   var mm = d.getMonth() + 1;
   var yyyy = d.getFullYear();
   var dateStr = yyyy + '-' + mm + '-' + dd;
   console.log('dateStr = ' + dateStr);
   var query_rec_collection = db.get('query_records');

   var onconnect_api_key = req.app.locals.onconnect_api_key;
   /* console.log('api key 2 ' + onconnect_api_key); */

   /* if the dateStr and zipcode collection does not exist, create one with readCount 1 */
   var query_record;
   query_rec_collection.findAndModify(
        { movieListingDate: dateStr, zipcode: zipcode },
        /* Cannot update with existing data values, it wouldn't increment count, and would return null */
        { $inc: {readCount: 1 }},
        { upsert: true , new: true }, function(err, query_record) {

        console.log(query_record);
        console.log('Zipcode='+zipcode +' date='+dateStr+'; readCount = '+query_record.readCount);

        if (query_record.readCount % 20 == 0 || query_record.readCount == 1) {

                unirest.get('http://data.tmsapi.com/v1.1/movies/showings?startDate=' + dateStr + '&zip=' + zipcode + '&api_key=' + onconnect_api_key)
                .headers({'Accept': 'application/json', 'Content-Type': 'application/json'})
                .end(function (response) {
                	movie_collection.update({'zipcode': zipcode, 'show_date': dateStr},
                                {'zipcode': zipcode, 'show_date': dateStr, 'movie_listing':response.body},
                                { upsert: true }, cb(req, res));
                	console.log('Movie database fetched from API and updated');
                	/*console.log(response.body);*/
                });
        } else {
                console.log('Using cache from internal movie database');
   		cb(req, res);
   }}
   )
}

/* GET some content from an external API provider */
router.get('/fetchMovies', function(req,res) {

   var zipcode = '94063';

   /* set our internal DB variable */
   var db = req.db;
   var movie_collection = db.get('local_movies');
   var d = new Date();
   var dd = d.getDate();
   var mm = d.getMonth() + 1;
   var yyyy = d.getFullYear();
   var dateStr = yyyy + '-' + mm + '-' + dd;
   console.log('dateStr = ' + dateStr); 

   var query_rec_collection = db.get('query_records'); 
   
   var onconnect_api_key = req.app.locals.onconnect_api_key;
   /* console.log('api key 2 ' + onconnect_api_key); */

   res.render('movies', { title: 'Fetching movies in theatres for ' + zipcode + ' on ' + dateStr});

   /* if the dateStr and zipcode collection does not exist, create one with readCount 0 */
   var query_record;
   query_rec_collection.findAndModify(
	{ movieListingDate: dateStr, zipcode: zipcode }, 
	/* Cannot update with existing data values, it wouldn't increment count, and would return null */
        { $inc: {readCount: 1 }}, 
        { upsert: true , new: true }, function(err, query_record) {

        console.log(query_record);
	console.log('Zipcode='+zipcode +' date='+dateStr+'; readCount = '+query_record.readCount); 

   	if (query_record.readCount % 20 == 0 || query_record.readCount == 1) { 


   		unirest.get('http://data.tmsapi.com/v1.1/movies/showings?startDate=' + dateStr + '&zip=' + zipcode + '&api_key=' + onconnect_api_key)
   		.headers({'Accept': 'application/json', 'Content-Type': 'application/json'})
   		.end(function (response) {
        	movie_collection.update({'zipcode': zipcode, 'show_date': dateStr},
                                {'zipcode': zipcode, 'show_date': dateStr, 'movie_listing':response.body},
                                { upsert: true });
        	console.log('Movie database fetched from API and updated');
        	/*console.log(response.body);*/

 
  		});
       	} else {
                console.log('Using cache from internal movie database');
        }
        /*console.log('About to exit query_record callback');*/
   }); 
});


/* GET some content from the database */
router.get('/listMovies', function(req,res) {

   var zip = '94063'; 
   fetchMoviesIntoDB(zip, req, res, function(req, res) {

   /* set our internal DB variable */
   var db = req.db;
   var movie_collection = db.get('local_movies');

   var d = new Date();
   var dd = d.getDate();
   var mm = d.getMonth() + 1;
   var yyyy = d.getFullYear();
   var dateStr = yyyy + '-' + mm + '-' + dd;
   
   console.log('GET - about to execute collection.find');
  
   	movie_collection.find({'zipcode': zip, 'show_date': dateStr},{},function(e,docs){
        	console.log('Reading from movie database, zipcode='+zip);
        if (docs[0].movie_listing == null) {
                res.render('no-movies', { zipcode: zip });
        } else {
        	res.render('movielist', {
            		"movielist" : docs[0]
        	});
	}
    	});
   });
});

/* POST some content from the database */
router.post('/listMovies', function(req,res) {

   var zip = req.body.zipcode;
   console.log('POST - zip code parameter='+zip);
   if (zip == null || zip == '') {
	res.render('no-movies', { zipcode: 'null' });
   } else {

   fetchMoviesIntoDB(zip, req, res, function(req, res) {

   /* set our internal DB variable */
   var db = req.db;
   var movie_collection = db.get('local_movies');

   var d = new Date();
   var dd = d.getDate();
   var mm = d.getMonth() + 1;
   var yyyy = d.getFullYear();
   var dateStr = yyyy + '-' + mm + '-' + dd;

   movie_collection.find({'zipcode': zip, 'show_date': dateStr},{},function(e,docs){
        console.log('Reading from movie database, zipcode='+zip);
	console.log('docs[0] =' + docs[0].movie_listing);
	if (docs[0].movie_listing == null) {
		res.render('no-movies', { zipcode: zip });
        } else {
        	res.render('movielist', {
            		"movielist" : docs[0]
        	});
	}
    });
   });
   }
});


module.exports = router;
