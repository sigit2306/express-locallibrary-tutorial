var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var moment = require("moment");

var BookInstanceSchema = new Schema(
	{
		book: { type: Schema.ObjectId, ref: "Book", required: true }, // reference to the associated book
		imprint: { type: String, required: true },
		status: { type: String, required: true, enum: ["Available", "Maintenance", "Loaned", "Reserved"], default: "Maintenance"},
		due_back: { type: Date, default: Date.now }
	}
);

// virtual for bookinstance's URL
BookInstanceSchema
	.virtual("url")
	.get(function () {
		return "/catalog/bookinstance/" + this._id;
	});

// virtual property due_back_formatted
BookInstanceSchema
	.virtual("due_back_formatted")
	.get(function () {
		return moment(this.due_back).format("MMMM Do, YYYY");
	});

// export model
module.exports = mongoose.model("BookInstance", BookInstanceSchema);