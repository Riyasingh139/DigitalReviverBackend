// Import mongoose
const mongoose = require('mongoose');

// Define the blog schema
const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  metaTitle: {
    type: String,
    default: '', // Optional, can be left empty if not provided
  },
  metaDescription: {
    type: String,
    default: '', // Optional
  },
  focusKeyword: {
    type: String,
    default: '', // Optional
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  image: {
    type: String,
    default: null, // Optional, image URL or path
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Create and export the model based on the schema
const Blog = mongoose.model('Blog', blogSchema);

module.exports = Blog;
