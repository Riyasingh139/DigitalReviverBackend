const express = require("express");
const PreviewService = require("../models/PreviewService"); // Ensure correct model
const upload = require("../middleware/upload");
const { authMiddleware, adminMiddleware } = require("../middleware/authMiddleware");
const slugify = require("slugify");
const Service = require("../models/Service");

const router = express.Router();

// Fetch all preview services (Only for Admin Dashboard)
router.get("/", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    console.log("\n=== FETCHING PREVIEW SERVICES ===");
    const services = await PreviewService.find().sort({ createdAt: -1 }); // FIXED Model Reference
    res.json(services);
  } catch (error) {
    console.error("Error fetching preview services:", error);
    res.status(500).json({ error: "Server error fetching preview services" });
  }
});

// Fetch a single preview service by slug
router.get("/:slug", authMiddleware, adminMiddleware, async (req, res) => {
  const { slug } = req.params;
  console.log("🔍 Searching for slug:", slug);

  try {
    const service = await PreviewService.findOne({ slug: req.params.slug }); // FIXED Model Reference

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    res.json(service);
  } catch (error) {
    console.error("Error fetching service:", error);
    res.status(500).json({ error: "Server error fetching service" });
  }
});

// Save a service as a draft (Preview)
router.post("/", authMiddleware, adminMiddleware, upload.single("image"), async (req, res) => {
  try {
    console.log("Request Body:", req.body);
    console.log("Uploaded File:", req.file);

    const { title, description, category, slug } = req.body;
    if (!title || !description || !category) {
      return res.status(400).json({ error: "Title, description, and category are required" });
    }

    let finalSlug = slug
      ? slugify(slug, { lower: true, strict: true })
      : slugify(title, { lower: true, strict: true });

    while (await PreviewService.findOne({ slug: finalSlug })) { // FIXED Model Reference
      finalSlug += `-${Math.floor(Math.random() * 1000)}`;
    }

    const imagePath = req.file ? req.file.path : null;

    const newService = new PreviewService({  // FIXED Model Reference
      title,
      description,
      slug: finalSlug,
      category,
      image: imagePath,
      createdAt: new Date(),
    });

    await newService.save();
    res.status(201).json({ message: "Service saved successfully", previewService: newService });

  } catch (error) {
    console.error("Error saving service:", error);
    res.status(500).json({ error: "Failed to save service" });
  }
});

// Update an existing preview service
router.put("/:slug", authMiddleware, adminMiddleware, async (req, res) => {
  console.log("PUT request received for:", req.params.slug);

  try {
    const previewService = await PreviewService.findOne({ slug: req.params.slug }); // FIXED Model Reference
    if (!previewService) {
      return res.status(404).json({ error: "Preview service not found" });
    }

    previewService.title = req.body.title || previewService.title;
    previewService.description = req.body.description || previewService.description;
    previewService.category = req.body.category || previewService.category;

    await previewService.save();
    res.status(200).json({ message: "Service updated successfully", service: previewService });

  } catch (error) {
    console.error("Error updating service:", error);
    res.status(500).json({ error: "Failed to update preview service", message: error.message });
  }
});

// Publish a preview service
router.post("/publish/:slug", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { slug } = req.params;
    const updatedService = req.body;

    console.log("User making request:", req.user);

    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized: Admin access required" });
    }

    const previewService = await PreviewService.findOne({ slug: req.params.slug  }); // FIXED Model Reference
    if (!previewService) {
      return res.status(404).json({ error: "Service not found in preview" });
    }

    let existingService = await Service.findOne({ slug });

    if (existingService) {
      await Service.updateOne({ slug }, { $set: updatedService });
      return res.status(200).json({ message: "Service updated successfully" });
    }

    const newPublishedService = new Service(previewService.toObject());
    await newPublishedService.save();

    res.status(200).json({ message: "Service published successfully" });
  } catch (error) {
    console.error("Error publishing service:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete a preview service
router.delete("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    console.log("Deleting from previewservices and services, slug:", slug);

    const deletedPreviewService = await PreviewService.findOneAndDelete({ slug }); // FIXED Model Reference
    const deletedService = await Service.findOneAndDelete({ slug });

    if (!deletedPreviewService && !deletedService) {
      return res.status(404).json({ error: "Service not found in either collection" });
    }

    res.json({ message: "Service deleted successfully from both collections" });
  } catch (error) {
    console.error("❌ Server error deleting service:", error);
    res.status(500).json({ error: "Server error deleting service" });
  }
});

module.exports = router;
