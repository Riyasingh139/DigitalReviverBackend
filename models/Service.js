const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema({
  title: String,
  slug: String,
  description: String,
  image: String,
  category: String,
  createdAt: { type: Date, default: Date.now },
  metaTitle: String,
  metaDescription: String,
  focusKeyword: String
});

module.exports = mongoose.model("Service", serviceSchema);
