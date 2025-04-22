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
      let {
        title,
        content,
        category,
        metaTitle,
        metaDescription,
        focusKeyword,
        slug,
      } = req.body;

      // Ensure required fields are present
      if (!title || !content || !category) {
        return res
          .status(400)
          .json({ error: "Title, content, and category are required" });
      }

      // Set default values for optional fields
      metaTitle = metaTitle || title; // Use title if metaTitle is not provided
      metaDescription = metaDescription || ""; // Default to empty string
      focusKeyword = focusKeyword || ""; // Default to empty string

      // Generate unique slug
      let originalSlug = slug
        ? slugify(slug, { lower: true, strict: true })
        : slugify(title, { lower: true, strict: true });

      let finalSlug = originalSlug;
      let count = 1;

      // Ensure the slug is unique
      while (await Blog.findOne({ slug: finalSlug })) {
        finalSlug = `${originalSlug}-${count}`;
        count++;
      }

      slug = finalSlug;

      // Handle image upload if present
      const imagePath = req.file ? req.file.path : null;

      const newBlog = new Blog({
        title,
        content,
        slug,
        category,
        metaTitle,
        metaDescription,
        focusKeyword,
        image: imagePath, // Save image path if image is uploaded
        createdAt: new Date(), // Optional: adds timestamp
      });

      // Save the new blog post
      await newBlog.save();

      res.status(201).json({
        message: "Blog created successfully",
        blog: newBlog,
      });
    } catch (error) {
      console.error("Blog creation error:", error);
      res.status(500).json({
        error: "Failed to create blog",
        message: error.message,
      });
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

router.delete("/:slug", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { slug } = req.params;

    const deletedBlog = await PreviewBlog.findOneAndDelete({ slug });

    if (!deletedBlog) {
      return res.status(404).json({ message: "Preview blog not found" });
    }

    res.status(200).json({ message: "Preview blog deleted successfully" });
  } catch (error) {
    console.error("Error deleting preview blog:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});


module.exports = router;
