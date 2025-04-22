const express = require("express");
const PreviewService = require("../models/PreviewService");
const Service = require("../models/Service");
const upload = require("../middleware/upload");
const { authMiddleware, adminMiddleware } = require("../middleware/authMiddleware");
const slugify = require("slugify");
const cloudinary = require("cloudinary").v2;

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
    const {
      title,
      slug,
      description,
      category,
      metaTitle,
      metaDescription,
      focusKeyword,
    } = req.body;

    // Auto-generate slug if not provided
    let serviceSlug = slug;
    if (!serviceSlug && title) {
      serviceSlug = title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-");
    }

    
    // Upload the image to Cloudinary
    let imageUrl = null;
    if (req.file) {
      const uploadResponse = await cloudinary.uploader.upload(req.file.path, {
        folder: 'services', // Optional: Store in 'services' folder
      });
      imageUrl = uploadResponse.secure_url; // Save the secure URL
    }

    const newService = new PreviewService({
      title,
      slug: serviceSlug,
      description,
      category,
      metaTitle,
      metaDescription,
      focusKeyword,
      image: imageUrl,
    });

    await newService.save();

    res.status(201).json({ message: "Preview service created", newService });
  } catch (error) {
    console.error("Error creating preview service:", error);
    res.status(500).json({
      error: "Failed to create preview service",
      message: error.message,
    });
  }
});

// 🔹 Update a preview service by slug
router.put("/:slug", authMiddleware, adminMiddleware, upload.single("image"), async (req, res) => {
  try {
    const { slug } = req.params;
    const { title, description, category, metaTitle, metaDescription, focusKeyword } = req.body;
    const { file } = req;

    // Find the existing preview service by slug
    const service = await PreviewService.findOne({ slug });
    if (!service) {
      return res.status(404).json({ message: 'Preview service not found' });
    }

    // Update fields based on provided data
    service.title = title || service.title;
    service.description = description || service.description;
    service.category = category || service.category;
    service.metaTitle = metaTitle || service.metaTitle;
    service.metaDescription = metaDescription || service.metaDescription;
    service.focusKeyword = focusKeyword || service.focusKeyword;

    // Handle image update if file is provided
    if (file) {
      try {
        const uploadResponse = await cloudinary.uploader.upload(file.path);
        service.image = uploadResponse.secure_url; // Replace old image URL with new one
      } catch (uploadError) {
        console.error("Cloudinary upload failed:", uploadError);
        return res.status(500).json({ message: 'Image upload failed', error: uploadError.message });
      }
    }

    // Save the updated service to the database
    await service.save();
    return res.status(200).json({ message: 'Service updated successfully', service });

  } catch (error) {
    console.error("Error in updating preview service:", error);
    return res.status(500).json({ message: 'Failed to update preview service', error: error.message });
  }
});

// 🔹 Publish a preview service (move it to Service collection)


router.post(
  "/publish/:slug",
  authMiddleware,
  adminMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      const { title, description, category, metaTitle, metaDescription, focusKeyword } = req.body;
      const { file } = req;

      if (!title || !description || !category) {
        return res.status(400).json({ message: 'Title, description, and category are required' });
      }

      const slug = slugify(title, { lower: true });

      // Check for preview service by slug param
      const previewService = await PreviewService.findOne({ slug: req.params.slug });
      if (!previewService) {
        return res.status(404).json({ message: "Preview service not found" });
      }

      // Upload image if file is present
      let imageUrl = previewService.image; // keep existing image by default
      if (file) {
        const uploadResponse = await cloudinary.uploader.upload(file.path);
        imageUrl = uploadResponse.secure_url;
      }

      // Prepare service data
      const serviceData = {
        title,
        description,
        category,
        slug,
        metaTitle: metaTitle || '',
        metaDescription: metaDescription || '',
        focusKeyword: focusKeyword || '',
        image: imageUrl,
      };

      // If service exists, update it. Else, create new
      const existingService = await Service.findOne({ slug });
      if (existingService) {
        await Service.updateOne({ slug }, { $set: serviceData });
      } else {
        const newService = new Service(serviceData);
        await newService.save();
      }

      return res.status(200).json({ message: "Service published successfully" });

    } catch (error) {
      console.error("Error in publishing service:", error);
      return res.status(500).json({ message: 'Failed to publish service', error: error.message });
    }
  }
);



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
