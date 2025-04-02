require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("./models/Admin"); // Adjust path if needed

mongoose.connect(process.env.MONGO_CONN, { useNewUrlParser: true, useUnifiedTopology: true });

async function resetAdminPassword() {
  try {
    const newPassword = "RiyaThakur@2913"; // CHANGE BEFORE RUNNING!
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const updated = await Admin.updateOne(
      { username: "admin" }, 
      { password: hashedPassword }
    );

    if (updated.modifiedCount > 0) {
      console.log(" Admin password reset successfully!");
    } else {
      console.log("⚠️ No admin found! Create an admin first.");
    }

  } catch (error) {
    console.error(" Error resetting password:", error);
  } finally {
    mongoose.connection.close();
  }
}

resetAdminPassword();
