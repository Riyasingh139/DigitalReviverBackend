const express = require("express");
const Blog = require("../models/Blog");
const upload = require("../middleware/upload");
const {
  authMiddleware,
  adminMiddleware,
} = require("../middleware/authMiddleware");
const slugify = require("slugify");

const router = express.Router();

// 🔹 GET all blogs (Public)
router.get("/",  async (req, res) => {
  try {
    const blogs = await Blog.find();
    res.json(blogs);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET a blog by slug
router.get("/:slug", async (req, res) => {
  console.log("Incoming request for blog:", req.params.slug); // Debugging log

  try {
    const blog = await Blog.findOne({ slug: req.params.slug });

    if (!blog) {
      console.log("No blog found in MongoDB!");
      return res.status(404).json({ message: "Blog not found" });
    }

    console.log("Blog found:", blog);
    res.json(blog);
  } catch (error) {
    console.error("Error querying MongoDB:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// 🔹 CREATE a blog (Admin only)
router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      let { title, content, category, slug } = req.body;
      if (!title || !content || !category) {
        console.log("Received Data:", req.body);
        console.log("Received File:", req.file); // Check if multer is working
        return res
          .status(400)
          .json({ error: "Title, content, and category are required" });
      }

      // Generate slug from title if not provided
      let originalSlug = slug
        ? slugify(slug, { lower: true, strict: true })
        : slugify(title, { lower: true, strict: true });
      let finalSlug = originalSlug;
      let count = 1;

      while (await Blog.findOne({ slug: finalSlug })) {
        finalSlug = `${originalSlug}-${count}`;
        count++;
      }

      slug = finalSlug;

      const imagePath = req.file ? req.file.path : null;
      const newBlog = new Blog({
        title,
        content,
        slug,
        category,
        image: imagePath,
      });

      await newBlog.save();
      res
        .status(201)
        .json({ message: "Blog created successfully", blog: newBlog });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Failed to create blog", message: error.message });
    }
  }
);

// 🔹 UPDATE a blog (Admin only)
router.put(
  "/:slug",
  authMiddleware,
  adminMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      const { title, content, category } = req.body;
      if (!title || !content || !category) {
        return res
          .status(400)
          .json({ error: "Title, content, and category are required" });
      }

      let blog = await Blog.findOne({ slug: req.params.slug });
      if (!blog) return res.status(404).json({ error: "Blog not found" });

      // Keep the old image if no new one is uploaded
      const imagePath = req.file ? req.file.path : blog.image;

      blog.title = title;
      blog.content = content;
      blog.category = category;
      blog.image = imagePath;

      await blog.save();
      res.status(200).json({ message: "Blog updated successfully", blog });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Failed to update blog", message: error.message });
    }
  }
);

// 🔹 DELETE a blog (Admin only)
router.delete("/:slug", authMiddleware, adminMiddleware, async (req, res) => {
  const { slug } = req.params;

  try {
    const deletedBlog = await PreviewBlog.findOneAndDelete({ slug });

    if (!deletedBlog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    res.json({ message: "Blog deleted successfully" });
  } catch (error) {
    console.error("Error deleting blog:", error);
    res.status(500).json({ error: "Server error deleting blog" });
  }
});

module.exports = router;
