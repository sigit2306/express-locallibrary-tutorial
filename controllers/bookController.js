const Book = require("../models/book");
const Author = require("../models/author");
const Genre = require("../models/genre");
const BookInstance = require("../models/bookinstance");
const async = require("async");
const mongoose = require("mongoose");
const { body, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');


/*exports.index = function(req, res) {
    res.send('NOT IMPLEMENTED: Site Home Page');
};*/

exports.index = function (req, res) {
	async.parallel({
		book_count: function(callback) {
			Book.count({}, callback);	// pass an empty object as match condition to find al documents of this collection
		},
		book_instance_count: function (callback) {
			BookInstance.count({}, callback);
		},
		book_instance_available_count: function (callback) {
			BookInstance.count({ status: "Available" }, callback);
		},
		author_count: function (callback) {
			Author.count({}, callback);
		},
		genre_count: function (callback) {
			Genre.count({}, callback);
		}
	}, function (err, results) {
		//if (err) return error_handler(err);
		// on success
		res.render("index", { title: "Local Library Home", error: err, data: results });
	});
};



// Display list of all books.
/*exports.book_list = function(req, res) {
    res.send('NOT IMPLEMENTED: Book list');
};*/
exports.book_list = function (req, res, next) {
	Book.find({}, "title author")
		.populate("author")
		.exec(function (err, list_books) {
		if (err) { 
			return next(err); 			
		}
		// successful, so render
		res.render("book_list", { title: "Book List", book_list: list_books });
	});
};



// Display detail page for a specific book.
/*exports.book_detail = function(req, res) {
    res.send('NOT IMPLEMENTED: Book detail: ' + req.params.id);
};*/
exports.book_detail = function (req, res, next) {
	const id = mongoose.Types.ObjectId(req.params.id);
	async.parallel({
		book: function (callback) {
			Book.findById(id)
				.populate("author")
				.populate("genre")
				.exec(callback);
		},
		book_instance: function (callback) {
			BookInstance.find({ "book": id })
				.exec(callback);
		}
	}, function (err, results) {
		if (err) {
			return next(err);
		}
		if (results.book == null) {
			const err = new Error("Book not found");
			err.status = 404;
			return next(err);
		}
		// successful, so render
		res.render("book_detail", { title: "Book Detail", book: results.book, book_instances: results.book_instance });
	});
};

// Display book create form on GET.
/*exports.book_create_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Book create GET');
};*/
exports.book_create_get = function (req, res, next) {
	// get all authrs  and genres, which we can use for adding to our book.
	async.parallel({
		authors: function (callback) {
			Author.find(callback);
		},
		genres: function (callback) {
			Genre.find(callback);
		}
	}, function (err, results) {
		if (err) {
			return next(err);
		}
		// successful, so render
		res.render("book_form", { title: "Create Book", authors: results.authors, genres: results.genres });
	});
};

// Handle book create on POST.
/*exports.book_create_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Book create POST');
};*/
exports.book_create_post = [
	// convert the genre to an array
	(req, res, next) => {
		if (!(req.body.genre instanceof Array)) {
			if (typeof req.body.genre === "undefined") {
				req.body.genre = [];
			}
			else {
				req.body.genre = new Array(req.body.genre);
			}
		}
		next();
	},

	// validate fields.
	body("title", "Title must not be empty.").isLength({ min: 1 }).trim(),
	body("author", "Author must not be empty.").isLength({ min: 1 }).trim(),
	body("summary", "Summary must not be empty.").isLength({ min: 1 }).trim(),
	body("isbn", "ISBN must not be empty.").isLength({ min: 1 }).trim(),

	// sanitize fields(using wildcard).
	sanitizeBody("*").trim().escape(),
	sanitizeBody("genre.*").trim().escape(),

	// process request after validation and sanitization.
	(req, res, next) => {
		// extract the validation errors from a request.
		const errors = validationResult(req);

		// create a Book object with escaped and trimmed data.
		const book = new Book({
			title: req.body.title,
			author: req.body.author,
			summary: req.body.summary,
			isbn: req.body.isbn,
			genre: req.body.genre
		});

		if (!errors.isEmpty()) {
			// there are errors. render form again with sanitized values/error messages.

			// get all authors and genres for form
			async.parallel({
				authors: function () {
					Author.find(callback);
				},
				genres: function () {
					Genre.find(callback);
				}
			}, function (err, results) {
				if (err) {
					return next(err);
				}
				// mark our selected genres as checked.
				for (let i=0; i<results.genres.length; i++) {
					if (book.genre.indexOf(results.genres[i]._id) > -1) {
						results.genres[i].checked = "true";
					}
				}
				res.render("book_form", { title: "Create Book", authors: results.authors, genres: results.genres, book: book, errors: errors.array() });
			});
			return;
		}
		else {
			// data from form is valid. save book.
			book.save(function (err) {
				if (err) {
					return next(err);
				}
				// successful, redirect to new book record.
				res.redirect(book.url);
			});
		}
	}
];

// Display book delete form on GET.
/*exports.book_delete_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Book delete GET');
};*/
exports.book_delete_get = function (req, res, next) {
	async.parallel({
		book: function (callback) {
			Book.findById(req.params.id)
				.populate("author")
				.populate("genre")
				.exec(callback);
		},
		book_bookinstances: function (callback) {
			BookInstance.find({ "book": req.params.id})
				.exec(callback);
		}
	}, function (err, results) {
		if (err) {
			return next(err);
		}
		if (results.book == null) { // no results
			res.redirect("/catalog/books");
		}
		// successful, so render
		res.render("book_delete", { title: "Delete Book", book: results.book, book_instances: results.book_bookinstances });
	});
};

// Handle book delete on POST.
/*exports.book_delete_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Book delete POST');
};*/
exports.book_delete_post = function (req, res, next) {
	// assumes the post has valid id (ie no validation/sanitization)

	async.parallel({
		book: function (callback) {
			Book.findById(req.params.id)
				.populate("author")
				.populate("genre")
				.exec(callback);
		},
		book_bookinstances: function (callback) {
			BookInstance.find({ "book": req.params.id })
				.exec(callback);
		}
	}, function (err, results) {
		if (err) {
			return next(err);
		}
		if (results.book_bookinstances.length > 0) {
			// book has book_instance. render the same way as for GET route
			res.render("book_delete", { title: "Delete Book", book: results.book, book_instances: results.book_bookinstances });
			return;
		}
		else {
			// book has no BookInstance objects. delete object and redirect to the list of books.
			Book.findByIdAndRemove(req.body.id, function deleteBook(err) {
				if (err) {
					return next(err);
				}
				// success - go to books list
				res.redirect("/catalog/books");
			});
		}
	});
};



// Display book update form on GET.
/*exports.book_update_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Book update GET');
};*/
exports.book_update_get = function (req, res, next) {
	// get book, authors and genres for form
	const id = mongoose.Types.ObjectId(req.params.id);

	async.parallel({
		book: function (callback) {
			Book.findById(id)
				.populate("author")
				.populate("genre")
				.exec(callback);
		},
		authors: function (callback) {
			Author.find()
				.exec(callback);
		},
		genres: function (callback) {
			Genre.find()
				.exec(callback);
		}
	}, function (err, results) {
		if (err) {
			return next(err);
		}
		if (results.book==null) { // no results.
			const err = new Error("Book not found");
			err.status = 404;
			return next(err);
		}
		// success
		// mark our selected genres as checked
		for (let all_g_iter = 0; all_g_iter < results.genres.length; all_g_iter++) {
			for (let book_g_iter = 0; book_g_iter < results.book.genre.length; book_g_iter++) {
				if (results.genres[all_g_iter]._id.toString()==results.book.genre[book_g_iter]._id.toString()) {
					results.genres[all_g_iter].checked="true";
				}
			}
		}
		res.render("book_form", { title: "Update Book", authors: results.authors, genres: results.genres, book: results.book });
	});
};

// Handle book update on POST.
/*exports.book_update_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Book update POST');
};*/
exports.book_update_post = [
	// convert the genre to an array
	(req, res, next) => {
		if (!(req.body.genre instanceof Array)) {
			if (typeof req.body.genre==="undefined") {
				req.body.genre = [];
			}
			else {
				req.body.genre = new Array(req.body.genre);
			}
		}
		next();
	},

	// validate fields.
	body("title", "Title must not be empty.").isLength({ min: 1 }).trim(),
	body("author", "Author must not be empty.").isLength({ min: 1 }).trim(),
	body("summary", "Summary must not be empty.").isLength({ min: 1 }).trim(),
	body("isbn", "ISBN must not be empty.").isLength({ min: 1 }).trim(),

	// sanitize fields.
	sanitizeBody("title").trim().escape(),
	sanitizeBody("author").trim().escape(),
	sanitizeBody("summary").trim().escape(),
	sanitizeBody("isbn").trim().escape(),
	sanitizeBody("genre.*").trim().escape(),

	// process request after validation and sanitization.
	(req, res, next) =>{
		// extract the validation errors from a request
		const errors = validationResult(req);

		// create a Book object with escaped/trimmed data and old id.
		const book = new Book({
			title: req.body.title,
			author: req.body.author,
			summary: req.body.summary,
			isbn: req.body.isbn,
			genre: (typeof req.body.genre==="undefined") ? [] : req.body.genre,
			_id: req.params.id // this is required, or a new ID will be assigned
		});

		if (!errors.isEmpty()) {
			// there are errors. render form again with sanitized values/error messages.

			// get all authors and genres for form.
			async.parallel({
				authors: function (callback) {
					Author.find()
						.exec(callback);
				},
				genres: function (callback) {
					Genre.find()
						.exec(callback);
				}
			}, function (err, results) {
				if (err) {
					return next(err);
				}

				// mark our selected genres as checked.
				for (let i = 0; i < results.genres.length; i++) {
					if (book.genre.indexOf(results.genres[i]._id) > -1) {
						results.genres[i].checked = "true";
					}
				}

				res.render("book_form", { title: "Update Book", authors: results.authors, genres: results.genres, book: book, errors: errors.array() });
			});
			return;
		}
		else {
			// data from form is valid. update the record
			Book.findByIdAndUpdate(req.params.id, book, {}, function (err, thebook) {
				if (err) {
					return next(err);
				}
				// successful - redirect to book detail page
				res.redirect(thebook.url);
			});
		}
	}
];