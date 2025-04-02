const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the schema for a PreviewService
const previewServiceSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    slug: { type: String, unique: true },
    category: String,
    image: {
      type: String,
      required: false, // Make it optional if not always required
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Create a model from the schema
const PreviewService = mongoose.model('PreviewService', previewServiceSchema);

module.exports = PreviewService;
