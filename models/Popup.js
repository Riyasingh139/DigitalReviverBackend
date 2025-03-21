const mongoose = require("mongoose");
const moment = require("moment-timezone");

const popupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  message: { type: String, required: true },
  createdAt: {
    type: Date,
    default: () => moment().tz("Asia/Kolkata").toDate(),
  },
});

module.exports = mongoose.model("Popup", popupSchema);
