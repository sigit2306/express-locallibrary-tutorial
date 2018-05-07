var Author = require('../models/author');
var Book = require("../models/book");
var async = require("async");
var mongoose = require("mongoose");
var { body, validationResult } = require("express-validator/check");
var { sanitizeBody } = require("express-validator/filter");
var debug = require("debug")("author");

// Display list of all Authors.
/*exports.author_list = function(req, res) {
    res.send('NOT IMPLEMENTED: Author list');
};*/

exports.author_list = function (req, res, next) {
	Author.find()
		.sort([["family_name", "ascending"]])
		.exec(function (err, list_authors) {
			if (err) {
				return next(err);
			}
			// successful, so render
			res.render("author_list", { title: "Author List", author_list: list_authors });
		});
};

// Display detail page for a specific Author.
/*exports.author_detail = function(req, res) {
    res.send('NOT IMPLEMENTED: Author detail: ' + req.params.id);
};*/
exports.author_detail = function (req, res, next) {
	const id = mongoose.Types.ObjectId(req.params.id);

	async.parallel({
		author: function (callback) {
			Author.findById(id)
				.exec(callback);
		},
		authors_books: function (callback) {
			Book.find({ "author": id }, "title summary")
				.exec(callback);
		}
	}, function (err, results){
		if (err) {
			return next(err);
		}
		if (results.author==null) { // No results
			const err = new Error("Author not found");
			err.status = 404;
			return next(err);
		}
		// successful, so render
		res.render("author_detail", { title: "Author Detail", author: results.author, author_books: results.authors_books });
	});
};

// Display Author create form on GET.
/*exports.author_create_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Author create GET');
};*/
exports.author_create_get = function (req, res, next) {
	res.render("author_form", { title: "Create Author" });
};

// Handle Author create on POST.
/*exports.author_create_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Author create POST');
};*/
exports.author_create_post = [
	// validate fields.
	body("first_name").isLength({ min: 1 }).trim().withMessage("First name must be specified").isAlphanumeric().withMessage("First name has non-alphanumeric characters."),
	body("last_name").isLength({ min: 1 }).trim().withMessage("Family name must be specified.").isAlphanumeric().withMessage("Family name has non-alphanumeric characters."),
	body("date_of_birth", "Invalid date of birth").optional({ checkFalsy: true }).isISO8601(),
	body("date_of_death", "Invalid date of death").optional({ checkFalsy: true }).isISO8601(),
	
	// sanitize fields
	sanitizeBody("first_name").trim().escape(),
	sanitizeBody("family_name").trim().escape(),
	sanitizeBody("date_of_birth").toDate(),
	sanitizeBody("date_of_birth").toDate(),

	// process request after validation and sanitization
	(req, res, next) => {
		// extract the validation and sanitization
		const errors = validationResult(req);

		if (!errors.isEmpty()) {
			// there are errors. render form again with sanitized values/errors messages.
			res.render("author_form", { title: "Create Author", author: req.body, errors: errors.array() });
			return;
		}
		else {
			// data from form is valid.

			// create an Author object with escaped and trimmed data.
			const author = new Author({
				first_name: req.body.first_name,
				family_name: req.body.family_name,
				date_of_birth: req.body.date_of_birth,
				date_of_death: req.body.date_of_death
			});

			author.save(function (err) {
				if (err) {
					return next(err);
				}
				// successful - redirect to new author record
				res.redirect(author.url);
			});
		}
	}
];


// Display Author delete form on GET.
/*exports.author_delete_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Author delete GET');
};*/
exports.author_delete_get = function (req, res, next) {
	const id = mongoose.Types.ObjectId(req.params.id);

	async.parallel({
		author: function (callback) {
			Author.findById(id)
				.exec(callback);
		},
		authors_books: function (callback) {
			Book.find({ "author": id })
				.exec(callback);
		}
	}, function (err, results) {
		if (err) {
			return next(err);
		}
		if (results.author==null) { // no results.
			res.redirect("/catalog/authors");
		}
		// successful, so render
		res.render("author_delete", { title: "Delete Author", author: results.author, author_books: results.authors_books });
	});
};

// Handle Author delete on POST.
/*exports.author_delete_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Author delete POST');
};*/
exports.author_delete_post = function (req, res, next) {
	async.parallel({
		author: function (callback) {
			Author.findById(req.body.authorid)
				.exec(callback);
		},
		authors_books: function (callback) {
			Book.find({ "author": req.body.authorid })
				.exec(callback);
		}
	}, function (err, results) {
		if (err) { 
			return next(err);
		}
		if (results.authors_books.length > 0) {
			// Author has books. render in same way as for GET route.
			res.render("author_delete", { title: "Delete Author", author: results.author, author_books: results.authors_books });
		}
		else {
			// Author has no books. Delete object and redirect to the list of authors.
			Author.findByIdAndRemove(req.body.authorid, function deleteAuthor (err) {
				if (err) {
					return next(err);
				}
				// success - go to author list
				res.redirect("/catalog/authors");
			})
		}
	});
};

// Display Author update form on GET.
/*exports.author_update_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Author update GET');
};*/
exports.author_update_get = function (req, res, next){
	Author.findById(req.params.id, function (err, author) {
		if (err) {
			debug("update error" + err);
			return next(err);
		}
		if (author==null) { // no results
			const err = new Error("Author not found");
			err.status = 404;
			return next(err);
		}
		// success
		res.render("author_form", { title: "Update Author", author: author });
	});
};

// Handle Author update on POST.
/*exports.author_update_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Author update POST');
};*/
exports.author_update_post = [
	// validate fields.
	body("first_name").isLength({ min: 1 }).trim().withMessage("First name must be specified.").isAlphanumeric().withMessage("First name has non-alphanumeric characters."),
	body("family_name").isLength({ min: 1 }).trim().withMessage("Family name must be specified.").isAlphanumeric().withMessage("Family name has non-alphanumeric characters."),
	body("date_of_birth", "Invalid date of birth").optional({ checkFalsy: true }).isISO8601(),
	body("date_of_death", "Invalid date of death").optional({ checkFalsy: true }).isISO8601(),

	// sanitize fields.
	sanitizeBody("first_name").trim().escape(),
	sanitizeBody("family_name").trim().escape(),
	sanitizeBody("date_of_birth").toDate(),
	sanitizeBody("date_of_death").toDate(),

	// process request after validation and sanitization
	(req, res, next) => {
		// extract the validation errors from a request.
		const errors = validationResult(req);

		// create Author object with escaped and trimmed data (and the old id!)
		const author = new Author({
			first_name: req.body.first_name,
			family_name: req.body.family_name,
			date_of_birth: req.body.date_of_birth,
			date_of_death: req.body.date_of_death,
			_id: req.params.id // this is needed, if not then the object will be assigned a new id
		});

		// check for errors, if non then update
		if (!errors.isEmpty()) {
			// there are errors. render the form again with sanitized values an error messages.
			res.render("author_form", { title: "Update Author", author: author, errors: errors.array() });
			return;
		}
		else {
			// data from form is valid. update the record
			Author.findByIdAndUpdate(req.params.id, author, {}, function (err, theauthor) {
				if (err) {
					return next(err);
				}
				// successful - redirect to genre detail page.
				res.render(theauthor.url);
			});
		}
	}
];