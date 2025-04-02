const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  // price: { type: Number, required: true },
  image: { type: String },
});

module.exports = mongoose.model("Service", serviceSchema);
