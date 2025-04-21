const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the schema for a PreviewService
const previewServiceSchema = new Schema(
  {
    title: String,
  description: String,
  category: String,
  slug: { type: String, unique: true },
  metaTitle: String, // ✅ Must be here
  metaDescription: String,
  focusKeyword: String,
  image: String,
  createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Create a model from the schema
const PreviewService = mongoose.model('PreviewService', previewServiceSchema);

module.exports = PreviewService;
