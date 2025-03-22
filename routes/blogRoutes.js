const express = require("express");
const Blog = require("../models/Blog");
const upload = require("../middleware/upload"); 
const { authMiddleware, adminMiddleware } = require("../middleware/auth");

const router = express.Router();

// CREATE a blog (Admin only)
router.post("/", authMiddleware, adminMiddleware, upload.single("image"), async (req, res) => {
  try {
    let { title, content, slug, category } = req.body;

    if (!title || !content || !category) {
      return res.status(400).json({ error: "Title, content, and category are required" });
    }

    slug = slug ? slugify(slug, { lower: true, strict: true }) : slugify(title, { lower: true, strict: true });

    const imagePath = req.file ? req.file.path : null;
    const newBlog = new Blog({ title, content, slug, category, image: imagePath });

    await newBlog.save();
    res.status(201).json({ message: "Blog created successfully", blog: newBlog });

  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to create blog" });
  }
});

// UPDATE a blog (Admin only)
router.put("/:slug", authMiddleware, adminMiddleware, upload.single("image"), async (req, res) => {
  try {
    const { title, content, category } = req.body;

    if (!title || !content || !category) {
      return res.status(400).json({ error: "Title, content, and category are required" });
    }

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

// DELETE a blog (Admin only)
router.delete("/:slug", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const deletedBlog = await Blog.findOneAndDelete({ slug: req.params.slug });
    if (!deletedBlog) return res.status(404).json({ error: "Blog not found" });

    res.status(200).json({ message: "Blog deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to delete blog" });
  }
});

module.exports = router;
