const express = require("express");
const Service = require("../models/Service");
const router = express.Router();

// Get all services
router.get("/", async (req, res) => {
  try {
    const services = await Service.find();
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get a single service by slug
router.get("/:slug", async (req, res) => {
  try {
    const service = await Service.findOne({ slug: req.params.slug });
    if (!service) return res.status(404).json({ error: "Service not found" });
    res.json(service);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Create a new service
router.post("/", async (req, res) => {
  try {
    const { name, description, slug, price, image } = req.body;
    const newService = new Service({ name, description, slug, price, image });
    await newService.save();
    res.status(201).json(newService);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update a service
router.put("/:slug", async (req, res) => {
  try {
    const { name, description, price, image } = req.body;
    const service = await Service.findOneAndUpdate(
      { slug: req.params.slug },
      { name, description, price, image },
      { new: true }
    );
    if (!service) return res.status(404).json({ error: "Service not found" });
    res.json(service);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete a service
router.delete("/:slug", async (req, res) => {
  try {
    const service = await Service.findOneAndDelete({ slug: req.params.slug });
    if (!service) return res.status(404).json({ error: "Service not found" });
    res.json({ message: "Service deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
