const express = require("express");
const Service = require("../models/Service");
const upload = require("../middleware/upload");
const { authMiddleware, adminMiddleware } = require("../middleware/authMiddleware");
const slugify = require("slugify");

const router = express.Router();

// CREATE a new service (Admin only)
router.post("/", authMiddleware, adminMiddleware, upload.single("image"), async (req, res) => {
  try {
    let { title, description, slug, price } = req.body;

    if (!title || !description || !price) {
      return res.status(400).json({ error: "Title, description, and price are required" });
    }

    slug = slug ? slugify(slug, { lower: true, strict: true }) : slugify(title, { lower: true, strict: true });

    const imagePath = req.file ? req.file.path : null;
    const newService = new Service({ title, description, slug, price, image: imagePath });

    await newService.save();
    res.status(201).json({ message: "Service created successfully", service: newService });

  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to create service" });
  }
});

// UPDATE a service (Admin only)
router.put("/:slug", authMiddleware, adminMiddleware, upload.single("image"), async (req, res) => {
  try {
    const { title, description, price } = req.body;

    if (!title || !description || !price) {
      return res.status(400).json({ error: "Title, description, and price are required" });
    }

    const imagePath = req.file ? req.file.path : req.body.image;

    const updatedService = await Service.findOneAndUpdate(
      { slug: req.params.slug },
      { title, description, price, image: imagePath },
      { new: true }
    );

    if (!updatedService) return res.status(404).json({ error: "Service not found" });

    res.status(200).json({ message: "Service updated successfully", service: updatedService });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to update service" });
  }
});

// DELETE a service (Admin only)
router.delete("/:slug", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const deletedService = await Service.findOneAndDelete({ slug: req.params.slug });
    if (!deletedService) return res.status(404).json({ error: "Service not found" });

    res.status(200).json({ message: "Service deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to delete service" });
  }
});

module.exports = router;
