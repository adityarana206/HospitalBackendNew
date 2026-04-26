import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import validator from "validator";

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, minLength: [3, "First name must be at least 3 characters"] },
  lastName:  { type: String, required: true, minLength: [3, "Last name must be at least 3 characters"] },
  email:     { type: String, required: true, validate: [validator.isEmail, "Please provide a valid email"] },
  phone:     { type: String, required: true, minLength: [10, "Phone must be 10 digits"], maxLength: [10, "Phone must be 10 digits"] },
  nic:       { type: String, required: true, minLength: [13, "NIC must be 13 digits"], maxLength: [13, "NIC must be 13 digits"] },
  dob:       { type: Date, required: true },
  gender:    { type: String, required: true, enum: ["Male", "Female"] },
  password:  { type: String, required: true, minLength: [8, "Password must be at least 8 characters"], select: false },
  role:      { type: String, required: true, enum: ["Admin", "Patient", "Doctor"], default: "Patient" },
  doctorDepartment: { type: String },
  docAvatar: { public_id: String, url: String },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.generateJsonWebToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES,
  });
};

export const User = mongoose.model("User", userSchema);
