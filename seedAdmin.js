import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName:  String,
  email:     String,
  phone:     String,
  nic:       String,
  dob:       Date,
  gender:    String,
  password:  String,
  role:      String,
});

const User = mongoose.model("User", userSchema);

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: "MERN_HOSPITAL_MANAGEMENT_SYSTEM" });
    console.log("Connected to database.");

    await User.deleteOne({ role: "Admin" });

    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);

    const admin = await User.create({
      firstName: "Admin",
      lastName:  "Medicare",
      email:     process.env.ADMIN_EMAIL,
      phone:     "1234567890",
      nic:       "1234567890123",
      dob:       new Date("1990-01-01"),
      gender:    "Male",
      password:  hashedPassword,
      role:      "Admin",
    });

    console.log("✅ Admin seeded successfully!");
    console.log("   Email   :", admin.email);
    console.log("   Password:", process.env.ADMIN_PASSWORD);
    console.log("   ID      :", admin._id.toString());
  } catch (err) {
    console.error("Error seeding admin:", err.message);
  } finally {
    await mongoose.connection.close();
  }
};

seedAdmin();
