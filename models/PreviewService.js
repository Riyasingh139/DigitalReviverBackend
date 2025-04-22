const mongoose = require("mongoose");

const previewServiceSchema = new mongoose.Schema({
  title: String,
  description: String,
  category: String,
  image: String,
  metaTitle: String,
  metaDescription: String,
  focusKeyword: String,
  slug: {
    type: String,
    required: true,
    unique: true,
  }
  
});

module.exports = mongoose.model("PreviewService", previewServiceSchema);
