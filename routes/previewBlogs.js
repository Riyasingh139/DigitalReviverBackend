const express = require("express");
const PreviewBlog = require("../models/PreviewBlog");
const upload = require("../middleware/upload");
const { authMiddleware, adminMiddleware } = require("../middleware/authMiddleware");
const slugify = require("slugify");
const Blog = require("../models/Blog");
const cloudinary = require('cloudinary').v2;
const router = express.Router();


// Fetch all preview blogs (Only for Admin Dashboard)
router.get("/", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        console.log("\n=== FETCHING PREVIEW BLOGS ===");

      const blogs = await PreviewBlog.find().sort({ createdAt: -1 }); // Sort by latest
      res.json(blogs);
    } catch (error) {
      console.error("Error fetching preview blogs:", error);
      res.status(500).json({ error: "Server error fetching preview blogs" });
    }
  });
// Fetch a single preview blog by slug
router.get("/:slug", authMiddleware, adminMiddleware, async (req, res) => {
    const { slug } = req.params;
    console.log("🔍 Searching for slug:", slug);  // Check incoming slug

    try {
        console.log(`Requested Slug: ${slug}`);
        const blog = await PreviewBlog.findOne({ slug });

        if (!blog) {
            console.log("Blog not found in DB");
            return res.status(404).json({ message: "Blog not found" });
        }

        res.json(blog);
    } catch (error) {
        console.error("Error fetching blog:", error);
        res.status(500).json({ error: "Server error fetching blog" });
    }
});

// Save a blog as a draft (Preview)


// Update an existing preview blog (this was missing)
router.post("/", authMiddleware, adminMiddleware, upload.single("image"), async (req, res) => {
  try {
    const {
      title,
      content,
      category,
      metaTitle,
      metaDescription,
      focusKeyword,
      slug,
    } = req.body;

    // Validation
    if (!title || !content || !category) {
      console.log("Received Data:", req.body);
      console.log("Received File:", req.file);
      return res.status(400).json({
        error: "Title, content, and category are required",
      });
    }

    // Slug generation
    let finalSlug = slug
      ? slugify(slug, { lower: true, strict: true })
      : slugify(title, { lower: true, strict: true });

    // Ensure unique slug
    while (await PreviewBlog.findOne({ slug: finalSlug })) {
      finalSlug += `-${Math.floor(Math.random() * 1000)}`;
    }

    // Handle image upload
    const imagePath = req.file ? req.file.path : null;

    // Create new blog post
    const newBlog = new PreviewBlog({
      title,
      content,
      category,
      slug: finalSlug,
      image: imagePath,
      metaTitle: metaTitle || "",
      metaDescription: metaDescription || "",
      focusKeyword: focusKeyword || "",
      createdAt: new Date(),
    });

    await newBlog.save();

    res.status(201).json({
      message: "Blog saved successfully",
      previewblogs: newBlog, // Send the saved blog object back in the response
    });

  } catch (error) {
    console.error("Error saving blog:", error);
    res.status(500).json({ error: "Failed to save blog" });
  }
});




router.put("/:slug", authMiddleware, adminMiddleware, upload.single("image"), async (req, res) => {
  console.log("PUT request received for:", req.params.slug);

  try {
    const { slug } = req.params;
    const blog = await PreviewBlog.findOne({ slug });

    if (!blog) return res.status(404).json({ error: "Blog not found" });

    const {
      title,
      content,
      category,
      image,
      metaTitle,
      metaDescription,
      focusKeyword,
    } = req.body;

    blog.title = title;
    blog.content = content;
    blog.category = category;
    blog.image = image;
    blog.metaTitle = metaTitle;
    blog.metaDescription = metaDescription;
    blog.focusKeyword = focusKeyword;

    await blog.save();
    res.status(200).json({ message: "Blog updated successfully" });
  } catch (err) {
    console.error("Update Blog Error:", err);
    res.status(500).json({ error: "Failed to update blog" });
  }
});

router.post("/publish/:slug", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { slug } = req.params;

    // Check if the user is an admin
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized: Admin access required" });
    }

    // Find the preview blog by slug
    const previewBlog = await PreviewBlog.findOne({ slug });
    if (!previewBlog) {
      return res.status(404).json({ error: "Preview blog not found" });
    }

    // Check if the blog already exists in the main Blog collection
    const existingBlog = await Blog.findOne({ slug });

    const blogData = {
      title: previewBlog.title,
      content: previewBlog.content,
      slug: previewBlog.slug,
      category: previewBlog.category,
      image: previewBlog.image || "",
      metaTitle: previewBlog.metaTitle || "",
      metaDescription: previewBlog.metaDescription || "",
      focusKeyword: previewBlog.focusKeyword || "",
      createdAt: previewBlog.createdAt || new Date(),
      updatedAt: new Date(),
    };

    // If the blog exists, update it, else create a new one
    if (existingBlog) {
      await Blog.updateOne({ slug }, { $set: blogData });
    } else {
      const newBlog = new Blog(blogData);
      await newBlog.save();
    }

    // Do not delete the preview blog after publishing
    res.status(200).json({ message: "Blog published successfully" });
  } catch (error) {
    console.error("Error publishing blog:", error);
    res.status(500).json({ error: "Server error" });
  }
});



// DELETE full blog (image + document)
router.delete("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    // Check both collections
    const previewBlog = await PreviewBlog.findOne({ slug });
    const blog = await Blog.findOne({ slug });

    if (!previewBlog && !blog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    // Get image URL
    const imageUrl = previewBlog?.image || blog?.image;
    if (imageUrl) {
      const urlParts = imageUrl.split("/");
      const publicIdWithExt = urlParts.slice(urlParts.findIndex(p => p === "uploads") + 1).join("/");
      const publicId = publicIdWithExt.split(".")[0];

      const result = await cloudinary.uploader.destroy(publicId);
      console.log("Cloudinary delete result:", result);
    }

    // Delete the document
    if (previewBlog) {
      await PreviewBlog.deleteOne({ slug });
      console.log("PreviewBlog deleted");
    } else if (blog) {
      await Blog.deleteOne({ slug });
      console.log("Published Blog deleted");
    }

    return res.json({ message: "Blog and image deleted successfully" });
  } catch (err) {
    console.error("Error in delete blog route:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Add a new route for handling image uploads

// ✅ Image upload route
router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    res.status(200).json({ imageUrl: req.file.path });
  } catch (err) {
    console.error("Image Upload Error:", err);
    res.status(500).json({ error: "Image upload failed" });
  }
});

module.exports = router;
