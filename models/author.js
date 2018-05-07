var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var moment = require("moment");

var AuthorSchema = new Schema(
	{
		first_name: { type: String, require: true, max: 100 },
		family_name: { type: String, require: true, max: 100 },
		date_of_birth: { type: Date },
		date_of_death: { type: Date }
	}
);

// virtual (property0 for author's full name
AuthorSchema
	.virtual("name")
	.get(function () {
		return this.family_name + ", " + this.first_name;
	});

// virtual (property) for author's URL
AuthorSchema
	.virtual("url")
	.get(function () {
		return "/catalog/author/" + this._id;
	});

// virtual (property) for date_of_birth_formatted
AuthorSchema
	.virtual("date_of_birth_formatted")
	.get(function () {
		return this.date_of_birth ? moment(this.date_of_birth).format("YYYY-MM-DD") : "";
	});

// virtual (property) for date_of_death_formatted
AuthorSchema
	.virtual("date_of_death_formatted")
	.get(function () {
		return this.date_of_death ? moment(this.date_of_death).format("YYYY-MM-DD") : "";
	});

// export model
module.exports = mongoose.model("Author", AuthorSchema);
/*
const Author = mongoose.model("Author", AuthorSchema);
module.exports = Author;
*/