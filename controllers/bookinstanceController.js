var BookInstance = require('../models/bookinstance');
var mongoose = require("mongoose");
var async = require("async");

const { body, validationResult } = require("express-validator/check");
const { sanitizeBody } = require("express-validator/filter");
const Book = require("../models/book");

// Display list of all BookInstances.
exports.bookinstance_list = function(req, res) {
    /*res.send('NOT IMPLEMENTED: BookInstance list');*/
    BookInstance.find()
    	.populate("book")
    	.exec(function (err, list_bookinstances) {
    		if (err) {
    			return next(err);
    		}
    		// successful, so render
    		res.render("bookinstance_list", { title: "Book Instance List", bookinstance_list: list_bookinstances });
    	});
};

// Display detail page for a specific BookInstance.
/*exports.bookinstance_detail = function(req, res) {
    res.send('NOT IMPLEMENTED: BookInstance detail: ' + req.params.id);
};*/
exports.bookinstance_detail = function (req, res, next) {
    const id = mongoose.Types.ObjectId(req.params.id);

    BookInstance.findById(id)
        .populate("book")
        .exec(function (err, bookinstance) {
            if(err) {
                return next(err);
            }
            if (bookinstance==null) { // No results.
                const err = new Error("Book copy not found");
                err.status = 404;
                return next(err);
            }
            // successful, so render
            res.render("bookinstance_detail", { title: "Book", bookinstance: bookinstance });
        })
}

// Display BookInstance create form on GET.
/*exports.bookinstance_create_get = function(req, res) {
    res.send('NOT IMPLEMENTED: BookInstance create GET');
};*/
exports.bookinstance_create_get = function (req, res, next) {
    Book.find({}, "title")
        .exec(function (err, books) {
            if (err) {
                return next(err);
            }
            // successful, so render
            res.render("bookinstance_form", { title: "Create BookInstance", book_list: books });
        });
};

// Handle BookInstance create on POST.
/*exports.bookinstance_create_post = function(req, res) {
    res.send('NOT IMPLEMENTED: BookInstance create POST');
};*/
exports.bookinstance_create_post = [
    // validate fields. note: status will be hard coded on the view / template  
    body("book", "Book must be specified").isLength({ min: 1 }).trim(),
    body("imprint", "Imprint must be specified").isLength({ min: 1 }).trim(),
    body("due_back", "Invalid date").optional({ checkFalsy: true }).isISO8601(),

    // sanitize fields
    sanitizeBody("book").trim().escape(),
    sanitizeBody("imprint").trim().escape(),
    sanitizeBody("status").trim().escape(),
    sanitizeBody("due_back").trim().escape(),

    // process request after validation and sanitization
    (req, res, next) => {
        // extract the validation errors from a request
        const errors = validationResult(req);

        // create a BookInstance object with escaped and trimmed data.
        const bookinstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back
        });

        if (!errors.isEmpty()) {
            // there are no errors. render form again with sanitized values and error messages.
            Book.find({}, "title")
                .exec(function (err, books) {
                    if (err) {
                        return next(err);
                    }
                    // successful, so render.
                    res.render("bookinstance_form", { title: "Create BookInstance", book_list: books, selected_book: bookinstance.book._id, errors: errors.array(), bookinstance: bookinstance });
                });
            return;
        }
        else {
            // data from form is valid
            bookinstance.save(function (err) {
                if (err) {
                    // successful - redirect to new record
                    res.redirect(bookinstance.url);
                }
            });
        }
    }
];

// Display BookInstance delete form on GET.
/*exports.bookinstance_delete_get = function(req, res) {
    res.send('NOT IMPLEMENTED: BookInstance delete GET');
};*/
exports.


// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = function(req, res) {
    res.send('NOT IMPLEMENTED: BookInstance delete POST');
};

// Display BookInstance update form on GET.
/*exports.bookinstance_update_get = function(req, res) {
    res.send('NOT IMPLEMENTED: BookInstance update GET');
};*/
exports.bookinstance_update_get = function (req, res, next) {
    // get book, authors and genres for form
    async.parallel({
        bookinstance: function (callback) {
            BookInstance.findById(req.params.id)
                .populate("book")
                .exec(callback);
        },
        books: function (callback) {
            Book.find()
                .exec(callback);
        }
    }, function (err, results) {
        if (err) {
            return next(err);
        }
        if (results.bookinstance == null) { // no results
            const err = new Error("Book copy not found");
            err.status = 404;
            return next(err);
        }
        // success
        res.render("bookinstance_form", { title: "Update BookInstance", book_list: results.books, selected_book: results.bookinstance._id, bookinstance: results.bookinstance });
    });
};

// Handle bookinstance update on POST.
/*exports.bookinstance_update_post = function(req, res) {
    res.send('NOT IMPLEMENTED: BookInstance update POST');
};*/
exports.bookinstance_update_post = [
    // validate fields
    body("book", "Book must be specified").isLength({ min: 1 }).trim(),
    body("imprint", "Imprint must be specified").isLength({ min: 1 }).trim(),
    body("due_back", "Invalid date").optional({ checkFalsy: true }).isISO8601(),
        // note: status is not checked, because status is hard coded. but if you want to double check then it is OK
    
    // sanitize fields.
    sanitizeBody("book").trim().escape(),
    sanitizeBody("imprint").trim().escape(),
    sanitizeBody("status").trim().escape(),
    sanitizeBody("due_back").toDate(),

    // process request after validation and sanitization
    (req, res, next) =>{
        // extract the validation errors from a request.
        const errors = validationResult(req);

        // create a Bookinstance object with escaped and trimmed data and current id.
        const bookinstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back,
            _id: req.params.id
        });

        if (!errors.isEmpty) {
            // there are errors, so render the form again, passing sanitized values and error messages.
            Book.find({}, "title")
                .exec(function (err, books) {
                    if (err) {
                        return next(err);
                    }
                    // successful, so render
                    res.render("bookinstance_form", { title: "Update BookInstance", book_list: books, selected_book: bookinstance.book._id, errors: errors.array() });
            });
            return;
        }
        else {
            // data from form is valid. proceed to update
            BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {},  function (err, thebookinstance) {
                if (err) {
                    return next(err);
                }
                // successful -- redirect to genre detail page
                res.redirect(thebookinstance.url);
            });
        }
    }
];