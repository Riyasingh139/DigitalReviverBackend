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
    const previewBlog = await PreviewBlog.findOne({ slug: req.params.slug });

    if (!previewBlog) {
      console.log("No blog found for slug:", req.params.slug);
      return res.status(404).json({ error: "Preview blog not found" });
    }

    const { title, content, category, image, metaTitle, metaDescription, focusKeyword } = req.body;

    // Update fields
    previewBlog.title = title || previewBlog.title;
    previewBlog.content = content || previewBlog.content;
    previewBlog.category = category || previewBlog.category;
    previewBlog.metaTitle = metaTitle || previewBlog.metaTitle;
    previewBlog.metaDescription = metaDescription || previewBlog.metaDescription;
    previewBlog.focusKeyword = focusKeyword || previewBlog.focusKeyword;

    // Handle image update
    if (req.file) {
      if (previewBlog.image && previewBlog.image.startsWith("uploads/")) {
        const oldImagePath = path.join(__dirname, "..", previewBlog.image);
        fs.unlink(oldImagePath, (err) => {
          if (err) console.warn("⚠️ Failed to delete old image:", err);
        });
      }
      previewBlog.image = req.file.path;
    }
    if (image && typeof image === "string") {
      previewBlog.image = image;
    }
    await previewBlog.save();

    res.status(200).json({ message: "Blog updated successfully", blog: previewBlog });
  } catch (error) {
    console.error("Error updating blog:", error);
    res.status(500).json({ error: "Failed to update preview blog", message: error.message });
  }
});

router.post("/publish/:slug", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { slug } = req.params;

    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized: Admin access required" });
    }

    const previewBlog = await PreviewBlog.findOne({ slug });
    if (!previewBlog) {
      return res.status(404).json({ error: "Preview blog not found" });
    }

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

    if (existingBlog) {
      await Blog.updateOne({ slug }, { $set: blogData });
    } else {
      const newBlog = new Blog(blogData);
      await newBlog.save();
    }

    // ✅ Delete from PreviewBlog after publishing
    await PreviewBlog.deleteOne({ slug });

    res.status(200).json({ message: "Blog published and preview removed successfully" });
  } catch (error) {
    console.error("Error publishing blog:", error);
    res.status(500).json({ error: "Server error" });
  }
});



router.delete("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    // Find the preview blog and the main blog
    const previewBlog = await PreviewBlog.findOne({ slug });
    const blog = await Blog.findOne({ slug });

    // Check if either previewBlog or blog exists
    if (!previewBlog && !blog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    // Get the image URL to delete (either from previewBlog or blog)
    let imageUrl = previewBlog?.image || blog?.image;

    if (!imageUrl) {
      return res.status(404).json({ error: "No image found to delete" });
    }

    // Extract public ID from the image URL (assuming it is hosted on Cloudinary)
    const urlParts = imageUrl.split("/");
    const folderIndex = urlParts.findIndex(part => part === "uploads") + 1;
    const publicIdWithExt = urlParts.slice(folderIndex).join("/");
    const publicId = publicIdWithExt.split(".")[0]; // Get the public ID (excluding the extension)

    // Delete the image from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId);
    console.log("Cloudinary delete result:", result);

    // Update PreviewBlog collection (clear the image field)
    if (previewBlog) {
      previewBlog.image = null;
      await previewBlog.save();
      console.log("PreviewBlog image removed:", previewBlog.image);
    }

    // Update Blog collection (clear the image field)
    if (blog) {
      blog.image = null;
      await blog.save();
      console.log("Blog image removed:", blog.image);
    }

    // Respond with success message
    return res.json({ message: "Image deleted from Cloudinary and database updated" });

  } catch (err) {
    console.error("Error in delete image route:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Add a new route for handling image uploads
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    const streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream((error, result) => {
          if (result) {
            resolve(result);
          } else {
            reject(error);
          }
        });

        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
    };

    const result = await streamUpload(req);
    res.status(200).json({ imageUrl: result.secure_url });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Image upload failed' });
  }
});

module.exports = router;
