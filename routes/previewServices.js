const express = require("express");
const PreviewService = require("../models/PreviewService");
const Service = require("../models/Service");
const upload = require("../middleware/upload");
const { authMiddleware, adminMiddleware } = require("../middleware/authMiddleware");
const slugify = require("slugify");

const router = express.Router();

// 🔹 Get all preview services (Admin only)
router.get("/", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const services = await PreviewService.find().sort({ createdAt: -1 });
    res.json(services);
  } catch (error) {
    console.error("Error fetching preview services:", error);
    res.status(500).json({ error: "Server error fetching preview services" });
  }
});

// 🔹 Get a single preview service by slug
router.get("/:slug", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const service = await PreviewService.findOne({ slug: req.params.slug });
    if (!service) return res.status(404).json({ message: "Preview service not found" });
    res.json(service);
  } catch (error) {
    console.error("Error fetching service:", error);
    res.status(500).json({ error: "Server error fetching preview service" });
  }
});

// 🔹 Save a new preview service
router.post("/", authMiddleware, adminMiddleware, upload.single("image"), async (req, res) => {
  try {
    let { title, description, category, metaTitle, metaDescription, focusKeyword, slug } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ error: "Title, description, and category are required" });
    }

    let baseSlug = slug ? slugify(slug, { lower: true, strict: true }) : slugify(title, { lower: true, strict: true });
    let finalSlug = baseSlug;
    let count = 1;
    while (await PreviewService.findOne({ slug: finalSlug })) {
      finalSlug = `${baseSlug}-${count++}`;
    }

    const imagePath = req.file ? req.file.path : null;

    const newService = new PreviewService({
      title,
      description,
      slug: finalSlug,
      category,
      metaTitle: metaTitle || title,
      metaDescription: metaDescription || description,
      focusKeyword: focusKeyword || "default, keywords",
      image: imagePath,
    });

    await newService.save();
    res.status(201).json({ message: "Preview service saved", previewService: newService });

  } catch (error) {
    console.error("Error saving preview service:", error);
    res.status(500).json({ error: "Failed to save preview service" });
  }
});

// 🔹 Update preview service
router.put("/:slug", authMiddleware, adminMiddleware, upload.single("image"), async (req, res) => {
  try {
    const previewService = await PreviewService.findOne({ slug: req.params.slug });
    if (!previewService) return res.status(404).json({ error: "Preview service not found" });

    previewService.title = req.body.title || previewService.title;
    previewService.description = req.body.description || previewService.description;
    previewService.category = req.body.category || previewService.category;
    previewService.metaTitle = req.body.metaTitle || previewService.metaTitle;
    previewService.metaDescription = req.body.metaDescription || previewService.metaDescription;
    previewService.focusKeyword = req.body.focusKeyword || previewService.focusKeyword;
    if (req.file) previewService.image = req.file.path;

    await previewService.save();
    res.status(200).json({ message: "Preview service updated", service: previewService });

  } catch (error) {
    console.error("Error updating preview service:", error);
    res.status(500).json({ error: "Failed to update preview service" });
  }
});

router.post("/publish/:slug", authMiddleware, adminMiddleware, upload.single("image"), async (req, res) => {
  console.log("---- PUBLISHING SERVICE ----");
  console.log("Request Body:", req.body);
  console.log("Uploaded File:", req.file);
  try {
    const { slug } = req.params;
    const previewService = await PreviewService.findOne({ slug });

    if (!previewService) {
      return res.status(404).json({ error: "Preview service not found" });
    }

    // Clone preview data
    const previewData = previewService.toObject();
   
    
    // Override fields if provided in formData (especially SEO metadata)
    if (req.body.metaTitle) previewData.metaTitle = req.body.metaTitle;
    if (req.body.metaDescription) previewData.metaDescription = req.body.metaDescription;
    if (req.body.focusKeyword) previewData.focusKeyword = req.body.focusKeyword;

    // Handle image if uploaded
    if (req.file) {
      previewData.image = req.file.path; // Or req.file.filename depending on how you store it
    }

    const existing = await Service.findOne({ slug });

    if (existing) {
      await Service.updateOne({ slug }, { $set: previewData });
      return res.status(200).json({ message: "Service updated from preview" });
    }

    const published = new Service(previewData);
    await published.save();
    res.status(200).json({ message: "Service published successfully" });

  } catch (error) {
    console.error("Error publishing service:", error);
    res.status(500).json({ error: "Failed to publish service" });
  }
});

// 🔹 Delete preview + published service (if exists)
router.delete("/:slug", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { slug } = req.params;

    const previewDeleted = await PreviewService.findOneAndDelete({ slug });
    const serviceDeleted = await Service.findOneAndDelete({ slug });

    if (!previewDeleted && !serviceDeleted) {
      return res.status(404).json({ error: "Service not found in either collection" });
    }

    res.json({ message: "Service deleted from both collections (if existed)" });
  } catch (error) {
    console.error("Error deleting service:", error);
    res.status(500).json({ error: "Failed to delete service" });
  }
});

module.exports = router;
