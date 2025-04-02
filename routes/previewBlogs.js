const express = require("express");
const PreviewBlog = require("../models/PreviewBlog");
const upload = require("../middleware/upload");
const { authMiddleware, adminMiddleware } = require("../middleware/authMiddleware");
const slugify = require("slugify");
const Blog = require("../models/Blog");

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
    const { title, content, category, slug } = req.body;

    if (!title || !content || !category) {
      console.log("Received Data:", req.body);
      console.log("Received File:", req.file); // Check if multer is working
      return res.status(400).json({ error: "Title, content, and category are required" });
    }

    // Generate a unique slug
    let finalSlug = slug
      ? slugify(slug, { lower: true, strict: true })
      : slugify(title, { lower: true, strict: true });

    while (await PreviewBlog.findOne({ slug: finalSlug })) {
      finalSlug += `-${Math.floor(Math.random() * 1000)}`;
    }

    const imagePath = req.file ? req.file.path : null;

    // Save the blog in previewblogs collection
    const newBlog = new PreviewBlog({
      title,
      content,
      slug: finalSlug,
      category,
      image: imagePath,
      createdAt: new Date(),
    });

    await newBlog.save();
    res.status(201).json({ message: "Blog saved successfully", previewblogs: newBlog });

  } catch (error) {
    res.status(500).json({ error: "Failed to save blog" });
  }
});






router.put("/:slug", authMiddleware, adminMiddleware, async (req, res) => {
    console.log("PUT request received for:", req.params.slug); // Debug log
  
    try {
      const previewBlog = await PreviewBlog.findOne({ slug: req.params.slug });
      if (!previewBlog) {
        console.log("No blog found for slug:", req.params.slug);
        return res.status(404).json({ error: "Preview blog not found" });
      }
  
      previewBlog.title = req.body.title || previewBlog.title;
      previewBlog.content = req.body.content || previewBlog.content;
      previewBlog.category = req.body.category || previewBlog.category;
  
      await previewBlog.save();
      res.status(200).json({ message: "Blog updated successfully", blogs: previewBlog });
  
    } catch (error) {
      console.error("Error updating blog:", error);
      res.status(500).json({ error: "Failed to update preview blog", message: error.message });
    }
  });
  

// router.post("/publish/:slug", authMiddleware, adminMiddleware, async (req, res) => {
//   try {
//     const { slug } = req.params;
//     const previewBlog = await PreviewBlog.findOne({ slug });

//     if (!previewBlog) {
//       return res.status(404).json({ error: "Blog not found in preview" });
//     }

//     // Check if blog already exists in `blogs`
//     const existingBlog = await Blog.findOne({ slug });
//     if (existingBlog) {
//       return res.status(400).json({ error: "Blog already published" });
//     }

//     // Copy the blog to `blogs` without removing from `previewblogs`
//     const publishedBlog = new Blog({
//       title: previewBlog.title,
//       content: previewBlog.content,
//       slug: previewBlog.slug,
//       category: previewBlog.category,
//       image: previewBlog.image,
//       createdAt: previewBlog.createdAt,
//     });

//     await publishedBlog.save();

//     res.status(201).json({ message: "Blog published successfully", blog: publishedBlog });
//   } catch (error) {
//     console.error("Error publishing blog:", error);
//     res.status(500).json({ error: "Failed to publish blog" });
//   }
// });
router.post("/publish/:slug", authMiddleware , adminMiddleware , async (req, res) => {
  try {
    const { slug } = req.params;
    const updatedBlog = req.body;

    console.log("User making request:", req.user);

    // Ensure only authorized users can publish
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized: Admin access required" });
    }

    const previewBlog = await PreviewBlog.findOne({ slug });
    if (!previewBlog) {
      return res.status(404).json({ error: "Blog not found in preview" });
    }

    let existingBlog = await Blog.findOne({ slug });

    if (existingBlog) {
      // Update the published blog
      await Blog.updateOne({ slug }, { $set: updatedBlog });
      return res.status(200).json({ message: "Blog updated successfully" });
    }

    // Publish new blog
    const newPublishedBlog = new Blog(previewBlog.toObject());
    await newPublishedBlog.save();
    // await PreviewBlog.deleteOne({ slug });

    res.status(200).json({ message: "Blog published successfully" });
  } catch (error) {
    console.error("Error publishing blog:", error);
    res.status(500).json({ error: "Server error" });
  }
});


router.delete("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    console.log("Deleting from previewblogs and blogs, slug:", slug);

    // Delete from previewblogs collection
    const deletedPreviewBlog = await PreviewBlog.findOneAndDelete({ slug });

    // Delete from blogs collection
    const deletedBlog = await Blog.findOneAndDelete({ slug });

    // If neither exists, return an error
    if (!deletedPreviewBlog && !deletedBlog) {
      return res.status(404).json({ error: "Blog not found in either collection" });
    }

    res.json({ message: "Blog deleted successfully from both collections" });
  } catch (error) {
    console.error("❌ Server error deleting blog:", error);
    res.status(500).json({ error: "Server error deleting blog" });
  }
});


module.exports = router;
