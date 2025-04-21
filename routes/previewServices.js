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
// 🔹 Publish a preview service (move it to Service collection)
router.post("/publish/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const previewService = await PreviewService.findById(req.params.id);
    if (!previewService) return res.status(404).json({ message: 'Preview service not found' });

    const newService = new Service({
      title: previewService.title,
      description: previewService.description,
      category: previewService.category,
      image: previewService.image,
      metaTitle: previewService.metaTitle,
      metaDescription: previewService.metaDescription,
      focusKeyword: previewService.focusKeyword,
      slug: previewService.slug, // 🛠️ Fix typo: was 'slog'
    });

    await newService.save();
    await PreviewService.findByIdAndDelete(req.params.id);

    res.status(201).json({ message: 'Service published successfully', service: newService });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
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
