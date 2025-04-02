const express = require("express");
const Service = require("../models/Service");
const upload = require("../middleware/upload");
const { authMiddleware, adminMiddleware } = require("../middleware/authMiddleware");
const slugify = require("slugify");

const router = express.Router();

// 🔹 GET all services (Public)
router.get("/", async (req, res) => {
  try {
    const services = await Service.find();
    res.json(services);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// 🔹 GET a single service by slug (Public)
router.get("/:slug", async (req, res) => {
  try {
    const service = await Service.findOne({ slug: req.params.slug });

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    res.json(service);
  } catch (error) {
    console.error("Error fetching service:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// 🔹 CREATE a service (Admin only)
router.post("/", authMiddleware, adminMiddleware, upload.single("image"), async (req, res) => {
  try {
    console.log("Incoming service data:", req.body); // Debugging

    let { title, description, category, slug } = req.body;
    if (!title || !description || !category) {
      return res.status(400).json({ error: "Title, description, and category are required" });
    }

    // Generate a unique slug
    let originalSlug = slug ? slugify(slug, { lower: true, strict: true }) : slugify(title, { lower: true, strict: true });
    let finalSlug = originalSlug;
    let count = 1;

    while (await Service.findOne({ slug: finalSlug })) {
      finalSlug = `${originalSlug}-${count}`;
      count++;
    }
    slug = finalSlug;

    const imagePath = req.file ? req.file.path : null;
    const newService = new Service({ title, description, slug, category, image: imagePath });

    await newService.save();
    res.status(201).json({ message: "Service created successfully", service: newService });

  } catch (error) {
    res.status(500).json({ error: "Failed to create service", message: error.message });
  }
});

// 🔹 UPDATE a service (Admin only)
router.put("/:slug", authMiddleware, adminMiddleware, upload.single("image"), async (req, res) => {
  try {
    const { title, description, category } = req.body;
    if (!title || !description || !category) {
      return res.status(400).json({ error: "Title, description, and category are required" });
    }

    let service = await Service.findOne({ slug: req.params.slug });
    if (!service) return res.status(404).json({ error: "Service not found" });

    // Keep old image if not updating
    const imagePath = req.file ? req.file.path : service.image;

    service.title = title;
    service.description = description;
    service.category = category;
    service.image = imagePath;

    await service.save();
    res.status(200).json({ message: "Service updated successfully", service });

  } catch (error) {
    res.status(500).json({ error: "Failed to update service", message: error.message });
  }
});

// 🔹 DELETE a service (Admin only)
router.delete("/:slug", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const deletedService = await Service.findOneAndDelete({ slug: req.params.slug });
    if (!deletedService) return res.status(404).json({ error: "Service not found" });

    res.status(200).json({ message: "Service deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete service", message: error.message });
  }
});

module.exports = router;
