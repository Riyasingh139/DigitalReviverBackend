const express = require("express");
const Blog = require("../models/Blog");
const upload = require("../middleware/upload"); // Multer middleware for image upload
const router = express.Router();

// Get all blogs
router.get("/", async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.status(200).json(blogs);
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to fetch blogs" });
  }
});

// Create a new blog with image upload
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { title, content, slug } = req.body;
    if (!title || !content || !slug) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const imagePath = req.file ? req.file.path : null; // Cloudinary URL

    const newBlog = new Blog({ title, content, slug, image: imagePath });
    await newBlog.save();
    
    res.status(201).json({ message: "Blog created successfully", blog: newBlog });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to create blog" });
  }
});


// Update a blog post
router.put("/:slug", upload.single("image"), async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required" });
    }

    const imagePath = req.file ? `/uploads/${req.file.filename}` : req.body.image;

    const updatedBlog = await Blog.findOneAndUpdate(
      { slug: req.params.slug },
      { title, content, image: imagePath },
      { new: true }
    );

    if (!updatedBlog) return res.status(404).json({ error: "Blog not found" });

    res.status(200).json({ message: "Blog updated successfully", blog: updatedBlog });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to update blog" });
  }
});

// Delete a blog post
router.delete("/:slug", async (req, res) => {
  try {
    const deletedBlog = await Blog.findOneAndDelete({ slug: req.params.slug });
    if (!deletedBlog) return res.status(404).json({ error: "Blog not found" });

    res.status(200).json({ message: "Blog deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to delete blog" });
  }
});

module.exports = router;
