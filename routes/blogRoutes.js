const express = require("express");
const Blog = require("../models/Blog");
const upload = require("../middleware/upload"); // Multer middleware for Cloudinary
const router = express.Router();

//  GET all blogs
router.get("/", async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.status(200).json(blogs);
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to fetch blogs" });
  }
});

//  CREATE a new blog with image upload
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { title, content, slug, category } = req.body;

    if (!title || !content || !slug || !category) {
      return res.status(400).json({ error: "All fields (title, content, slug, category) are required" });
    }

    // ✅ Cloudinary stores images at `req.file.path`
    const imagePath = req.file ? req.file.path : null;

    const newBlog = new Blog({ title, content, slug, category, image: imagePath });
    await newBlog.save();

    res.status(201).json({ message: "Blog created successfully", blog: newBlog });
  } catch (error) {
    console.error("Error creating blog:", error);
    res.status(500).json({ error: error.message || "Failed to create blog" });
  }
});

//  UPDATE a blog post
router.put("/:slug", upload.single("image"), async (req, res) => {
  try {
    const { title, content, category } = req.body;

    if (!title || !content || !category) {
      return res.status(400).json({ error: "Title, content, and category are required" });
    }

    // Handle image update (use Cloudinary URL if new image is uploaded)
    const imagePath = req.file ? req.file.path : req.body.image;

    const updatedBlog = await Blog.findOneAndUpdate(
      { slug: req.params.slug },
      { title, content, category, image: imagePath },
      { new: true }
    );

    if (!updatedBlog) return res.status(404).json({ error: "Blog not found" });

    res.status(200).json({ message: "Blog updated successfully", blog: updatedBlog });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to update blog" });
  }
});

// DELETE a blog post
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
