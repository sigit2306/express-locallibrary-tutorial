var Genre = require('../models/genre');
var async = require("async");
var Book = require("../models/book");
var mongoose = require("mongoose");
const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

// Display list of all Genre.
/*exports.genre_list = function(req, res) {
    res.send('NOT IMPLEMENTED: Genre list');
};*/
exports.genre_list = function (req, res, next) {
	Genre.find()
		.sort([["name", "ascending"]])
		.exec(function (err, list_genres) {
			if (err) {
				return next(err);
			}
			// successful, so render
			res.render("genre_list", { title: "Genre List", genre_list: list_genres });
		});
};

// Display detail page for a specific Genre.
/*exports.genre_detail = function(req, res) {
    res.send('NOT IMPLEMENTED: Genre detail: ' + req.params.id);
};*/
exports.genre_detail = function (req, res, next) {
	const id = mongoose.Types.ObjectId(req.params.id)
	async.parallel({
		genre: function(callback) {
			Genre.findById(id)
				.exec(callback);
		},
		genre_books: function (callback) {
			Book.find({ "genre": id })
				.exec(callback);
		}
	}, function (err, results) {
		if (err) {
			return next(err);
		}
		if (results.genre == null) { // no result
			var err = new Error("Genre not found");
			err.status = 404;
			return next(err);
		}
		// successful, so render
		res.render("genre_detail", { title: "Genre Detail", genre: results.genre, genre_books: results.genre_books });
	});
};


// Display Genre create form on GET.
/*exports.genre_create_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Genre create GET');
};*/
exports.genre_create_get = function(req, res, next) {       
    res.render('genre_form', { title: 'Create Genre' });
};

// Handle Genre create on POST.
/*exports.genre_create_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Genre create POST');
};*/
exports.genre_create_post =  [
   
    // Validate that the name field is not empty.
    body('name', 'Genre name required').isLength({ min: 1 }).trim(),
    
    // Sanitize (trim and escape) the name field.
    sanitizeBody('name').trim().escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {
        //console.log(req.body.name);

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a genre object with escaped and trimmed data.
        var genre = new Genre(
          { name: req.body.name }
        );


        if (!errors.isEmpty()) {
            // There are errors. Render the form again with sanitized values/error messages.
            res.render('genre_form', { title: 'Create Genre', genre: genre, errors: errors.array()});
        	return;
        }
 
        else {
            // Data from form is valid.
            // Check if Genre with same name already exists.
            Genre.findOne({ 'name': req.body.name })
                .exec( function(err, found_genre) {
                     if (err) { return next(err); }

                     if (found_genre) {
                         // Genre exists, redirect to its detail page.
                         res.redirect(found_genre.url);
                     }

                     else {
                         genre.save(function (err) {
                           if (err) { return next(err); }
                           // Genre saved. Redirect to genre detail page.
                           res.redirect(genre.url);
                         });

                     }

                 });
        }
    }
];

// Display Genre delete form on GET.
/*exports.genre_delete_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Genre delete GET');
};*/
exports.genre_delete_get = function (req, res, next) {
    // get genre and book for form
    async.parallel({
        genre: function (callback) {
            Genre.findById(req.params.id)
                .exec(callback);
        },
        genre_books: function (callback) {
            Book.find({ "genre": req.params.id })
                .exec(callback);
        }
    }, function (err, results) {
        if (err) {
            return next(err);
        }
        if (results.genre == null) { // no results
            res.redirect("/catalog/genres");
        }
        // successful, so render
        res.render("genre_delete", { title: "Delete Genre", genre: results.genre, genre_books: results.genre_books });
    });    
};

// Handle Genre delete on POST.
/*exports.genre_delete_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Genre delete POST');
};*/
exports.genre_delete_post = function (req, res, next) {
    async.parallel({
        genre: function (callback) {
            Genre.findById(req.params.id)
                .exec(callback);
        },
        genre_books: function (callback) {
            Book.find({ "genre": req.params.id })
                .exec(callback);
        }
    }, function (err, results) {
        if (err) {
            return next(err);
        }
        // success
        if (results.genre_books.length  > 0) {
            // Genre has books. render in same way as for GET route
            res.render("genre_delete", { title: "Delete Genre", genre: results.genre, genre_books: results.genre_books });
            return;
        }
        else {
            // Genre has no books. Delete object and redirect to the list of genres.
            Genre.findByIdAndRemove(req.body.id, function (err) {
                if (err) {
                    return next(err);
                }
                // success - go to genres list
                res.redirect("/catalog/genres");
            });
        }
    });
};

// Display Genre update form on GET.
/*exports.genre_update_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Genre update GET');
};*/
exports.genre_update_get = function (req, res, next) {
    Genre.findById(req.params.id, function (err, genre) {
        if (err) {
            return next(err);
        }
        if (genre == null) {
            const err = new Error("Genre not found");
            err.status = 404;
            return next(err);
        }
        // success.
        res.render("genre_form", { title: "Update Genre", genre: genre });
    });
};

// Handle Genre update on POST.
/*exports.genre_update_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Genre update POST');
};*/
exports.genre_update_post = [
    // validate that the name field is not empty
    body("name", "Genre name required").isLength
    ({ min: 1 }).trim(),

    // sanitize (trim and escape) the name field.
    sanitizeBody("name").trim().escape(),

    //process request after validation and sanitization.
    (req, res, next) => {
        // extract the validation errors from a request.
        const errors = validationResult(req);

        // create a genre object with escaped and trimmed data (and the old id!)
        const genre = new Genre({
            name: req.body.name,
            _id: req.params.id
        });

        if (!errors.isEmpty()) {
            // there are errors. render the form again with sanitized values and error messages.
            res.render("genre_form", { title: "Update Genre", genre: genre, errors:  errors.array() });
            return;
        }
        else {
            // data from form is valid, update the record.
            Genre.findByIdAndUpdate(req.params.id, genre, {}, function(err, thegenre) {
                if (err) {
                    return next(err);
                }
                // successful - redirect to genre detail page
                res.redirect(thegenre.url);
            });
        }
    }
];