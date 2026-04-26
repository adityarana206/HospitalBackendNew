
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { v2 as cloudinary } from 'cloudinary'; // Added Cloudinary
import fileUpload from 'express-fileupload'; // Added File Upload middleware

import Doctor from './models/Doctor.js';
import Appointment from './models/appointmentSchema.js';
import User from './models/User.js';

import ServiceBooking from './models/ServiceBooking.js';

import Service from './models/Service.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// --- CLOUDINARY CONFIGURATION ---
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.use(fileUpload({ useTempFiles: true })); // Required to handle image files

// Razorpay Initialization
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// --- PAYMENT ROUTES ---

// 1. Create Razorpay Order
app.get('/api/test-server', (req, res) => {
  res.send("Server is reaching the routes correctly!");
});
app.post('/api/create-order', async (req, res) => {
  try {
    const options = {
      amount: req.body.amount * 100, // Amount in paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };
    const order = await razorpay.orders.create(options);
    res.json(order); 
  } catch (err) {
    console.error("Razorpay Order Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Verify Payment Signature
app.post('/api/verify-payment', (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  
  const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
  hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
  const generatedSignature = hmac.digest('hex');

  if (generatedSignature === razorpay_signature) {
    res.json({ status: "success" });
  } else {
    res.status(400).json({ status: "failure" });
  }
});
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ MongoDB Connection Error:", err));

// --- DOCTOR & APPOINTMENT ROUTES ---

app.get('/api/doctors', async (req, res) => {
  try {
    const doctors = await Doctor.find(); 
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.get('/api/doctors/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    let doctor = await Doctor.findOne({ name: { $regex: new RegExp("^" + identifier + "$", "i") } });
    if (!doctor && mongoose.Types.ObjectId.isValid(identifier)) doctor = await Doctor.findById(identifier);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    res.json(doctor);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post('/api/appointments', async (req, res) => {
  try {
    const newAppointment = new Appointment(req.body);
    await newAppointment.save();
    res.status(201).json({ message: "Appointment saved!" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/appointments/user/:clerkId', async (req, res) => {
  try {
    const appointments = await Appointment.find({ userId: req.params.clerkId });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch appointments" });
  }
});

app.put('/api/appointments/:id', async (req, res) => {
  try {
    const updated = await Appointment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: "Update failed" });
  }
});

app.delete('/api/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findById(id);
    if (!appointment) return res.status(404).json({ message: "Not found" });
    const aptDate = new Date(appointment.appointmentDate);
    const diffInHours = (aptDate - new Date()) / (1000 * 60 * 60);
    let fineCharged = diffInHours < 24;
    await Appointment.findByIdAndDelete(id);
    res.json({ message: "Cancelled", fineCharged });
  } catch (err) {
    res.status(500).json({ error: "Cancellation failed" });
  }
});

// --- SERVICE ROUTES ---

app.post('/api/services/book', async (req, res) => {
  try {
    const newService = new ServiceBooking(req.body);
    await newService.save();
    res.status(201).json({ message: "Service booked successfully!" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/services/user/:clerkId', async (req, res) => {
  try {
    const services = await ServiceBooking.find({ userId: req.params.clerkId });
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch services" });
  }
});

app.put('/api/services/:id', async (req, res) => {
  try {
    const updated = await ServiceBooking.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: "Update failed" });
  }
});

// --- ADMIN DASHBOARD ANALYTICS ---
app.get('/api/admin/stats', async (req, res) => {
  try {
    const totalDoctors = await Doctor.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalAppointments = await Appointment.countDocuments();
    const completedApts = await Appointment.countDocuments({ status: "Completed" });
    const canceledApts = await Appointment.countDocuments({ status: "Cancelled" });

    const appointments = await Appointment.find({ status: "Confirmed" });
    const totalEarnings = appointments.length * 1000; 

    res.json({
      totalDoctors,
      totalUsers,
      totalAppointments,
      totalEarnings,
      completed: completedApts,
      canceled: canceledApts
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch admin stats" });
  }
});

app.get('/api/admin/doctors-list', async (req, res) => {
  try {
    const doctors = await Doctor.find();
    
    const doctorsWithStats = await Promise.all(doctors.map(async (doc) => {
      const appointments = await Appointment.find({ doctorName: doc.name });
      const completedCount = appointments.filter(a => a.status === "Completed").length;
      const canceledCount = appointments.filter(a => a.status === "Cancelled").length;
      
      return {
        ...doc._doc,
        appointmentsCount: appointments.length,
        completedCount,
        canceledCount,
        totalEarnings: completedCount * (doc.fees || 1000) 
      };
    }));

    res.json(doctorsWithStats);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch doctors list" });
  }
});

// --- UPDATED ADD DOCTOR ROUTE ---
app.post('/api/admin/add-doctor', async (req, res) => {
  try {
    let imageUrl = "";

    // Upload to Cloudinary if image exists
    if (req.files && req.files.image) {
      const file = req.files.image;
      const result = await cloudinary.uploader.upload(file.tempFilePath, {
        folder: 'medicare_doctors',
      });
      imageUrl = result.secure_url;
    }

    const newDoctor = new Doctor({
      ...req.body,
      imageUrl, // Use the Cloudinary URL
      appointmentsCount: 0,
      completedCount: 0,
      canceledCount: 0,
      totalEarnings: 0
    });
    await newDoctor.save();
    res.status(201).json({ message: "Doctor added successfully!" });
  } catch (err) {
    res.status(500).json({ error: "Failed to add doctor." });
  }
});

app.get('/api/admin/doctors-list', async (req, res) => {
  try {
    const doctors = await Doctor.find(); 
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch doctors from database" });
  }
});
// --- server.js ---
app.get('/api/admin/all-appointments', async (req, res) => {
  try {
    // Fetch all appointments and sort by most recent date
    const appointments = await Appointment.find().sort({ appointmentDate: -1 });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch all appointments" });
  }
});
// --- server.js ---
app.get('/api/admin/service-stats', async (req, res) => {
  try {
    const allServices = await Service.find({});
    const allBookings = await ServiceBooking.find({});

    // Calculate Global Stats for the top bubbles
    const stats = {
      totalServices: allServices.length,
      totalAppointments: allBookings.length,
      totalEarning: allBookings
        .filter(b => b.status === "Completed")
        .reduce((sum, b) => sum + (Number(b.price) || 0), 0),
      completed: allBookings.filter(b => b.status === "Completed").length,
      canceled: allBookings.filter(b => b.status === "Cancelled").length
    };

    // Map stats to each specific service for the table
    const serviceList = allServices.map(service => {
      const relatedBookings = allBookings.filter(b => b.serviceName === service.name);
      return {
        ...service._doc,
        appointments: relatedBookings.length,
        completed: relatedBookings.filter(b => b.status === "Completed").length,
        canceled: relatedBookings.filter(b => b.status === "Cancelled").length,
        earning: relatedBookings
          .filter(b => b.status === "Completed")
          .reduce((sum, b) => sum + (Number(b.price) || 0), 0)
      };
    });

    res.json({ stats, serviceList });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/admin/add-service', async (req, res) => {
  try {
    let imageUrl = "";

    // 1. Handle Image Upload to Cloudinary
    if (req.files && req.files.image) {
      const file = req.files.image;
      const result = await cloudinary.uploader.upload(file.tempFilePath, {
        folder: 'medicare_services',
      });
      imageUrl = result.secure_url;
    }

    // 2. Parse JSON strings back into arrays
    const instructions = req.body.instructions ? JSON.parse(req.body.instructions) : [];
    const slots = req.body.slots ? JSON.parse(req.body.slots) : [];

    // 3. Create and Save the Service
    const newService = new Service({
      name: req.body.name,
      price: Number(req.body.price),
      availability: req.body.availability || "Available",
      description: req.body.description,
      imageUrl: imageUrl,
      instructions: instructions,
      slots: slots
    });

    await newService.save();
    res.status(201).json({ success: true, message: "Service added successfully!" });
  } catch (err) {
    console.error("Add Service Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});
// --- backend/server.js ---


app.get('/api/admin/all-services', async (req, res) => {
  try {
    // Fetch all services and sort them by the most recently added
    const services = await Service.find({}).sort({ createdAt: -1 });
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch services" });
  }
});
app.get('/api/admin/service-appointments', async (req, res) => {
  try {
    // Fetch all service bookings, sorted by date
    const bookings = await ServiceBooking.find({}).sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch service appointments" });
  }
});
// --- backend/server.js ---
app.post('/api/admin/login', async (req, res) => {
  const { email, password } = req.body;

  // 1. Authorized Admin Email (Set this in your .env as ADMIN_EMAIL)
  const AUTHORIZED_ADMIN = process.env.ADMIN_EMAIL || "priyanshi@medicare.com";
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

  if (email === AUTHORIZED_ADMIN && password === ADMIN_PASSWORD) {
    // Generate a token or simple success response
    res.json({ 
      success: true, 
      message: "Admin Authenticated",
      token: "admin-secure-session-token" // In production, use JWT
    });
  } else {
    res.status(401).json({ 
      success: false, 
      message: "Unauthorized: Only the official Admin can enter." 
    });
  }
});
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));


// import express from 'express';
// import mongoose from 'mongoose';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import Razorpay from 'razorpay';
// import crypto from 'crypto';
// import { v2 as cloudinary } from 'cloudinary';
// import fileUpload from 'express-fileupload';

// // Model Imports
// import Doctor from './models/Doctor.js';
// import Appointment from './models/appointmentSchema.js';
// import User from './models/User.js';
// import ServiceBooking from './models/ServiceBooking.js';
// import Service from './models/Service.js';

// dotenv.config();

// const app = express();
// app.use(cors());
// app.use(express.json());
// app.use(fileUpload({ useTempFiles: true }));

// // --- CLOUDINARY CONFIGURATION ---
// cloudinary.config({ 
//   cloud_name: 'dqljwkiyo', 
//   api_key: '618767924698894', 
//   api_secret: '3f6RXKXfkowH-cHV9n_PSsvp5Js' 
// });

// // Razorpay Initialization
// const razorpay = new Razorpay({
//   key_id: 'rzp_test_eWbSbu5AuEM5Ey', 
//   key_secret: 'tBff6amDLXeNGSEphKN81tfZ',
// });

// // --- DATABASE CONNECTION ---
// mongoose.connect(process.env.MONGODB_URI)
//   .then(() => console.log("✅ MongoDB Connected"))
//   .catch(err => console.log("❌ MongoDB Connection Error:", err));

// // --- PAYMENT ROUTES ---
// app.post('/api/create-order', async (req, res) => {
//   try {
//     const options = {
//       amount: req.body.amount * 100,
//       currency: "INR",
//       receipt: `receipt_${Date.now()}`,
//     };
//     const order = await razorpay.orders.create(options);
//     res.json(order); 
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// app.post('/api/verify-payment', (req, res) => {
//   const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
//   const hmac = crypto.createHmac('sha256', 'tBff6amDLXeNGSEphKN81tfZ');
//   hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
//   const generatedSignature = hmac.digest('hex');
//   if (generatedSignature === razorpay_signature) {
//     res.json({ status: "success" });
//   } else {
//     res.status(400).json({ status: "failure" });
//   }
// });

// // --- DOCTOR & APPOINTMENT ROUTES ---
// app.get('/api/doctors', async (req, res) => {
//   try { res.json(await Doctor.find()); } catch (err) { res.status(500).json({ error: "Database error" }); }
// });

// app.post('/api/appointments', async (req, res) => {
//   try {
//     const newAppointment = new Appointment(req.body);
//     await newAppointment.save();
//     res.status(201).json({ message: "Appointment saved!" });
//   } catch (err) { res.status(400).json({ error: err.message }); }
// });

// app.get('/api/appointments/user/:clerkId', async (req, res) => {
//   try { res.json(await Appointment.find({ userId: req.params.clerkId })); } catch (err) { res.status(500).json({ error: "Failed to fetch appointments" }); }
// });

// // --- USER SERVICE BOOKING ROUTES ---
// app.post('/api/services/book', async (req, res) => {
//   try {
//     // Log the incoming data to verify userId is present
//     console.log("Booking data received:", req.body);
    
//     const newService = new ServiceBooking(req.body);
//     await newService.save();
//     res.status(201).json({ success: true, message: "Service booked successfully!" });
//   } catch (err) {
//     console.error("Booking Error:", err);
//     res.status(400).json({ error: err.message });
//   }
// });

// app.get('/api/services/user/:clerkId', async (req, res) => {
//   try {
//     const { clerkId } = req.params;
//     // Querying 'userId' field in the 'servicebookings' collection
//     const services = await ServiceBooking.find({ userId: clerkId }).sort({ createdAt: -1 });
//     res.json(services);
//   } catch (err) {
//     res.status(500).json({ error: "Failed to fetch services" });
//   }
// });
// // --- ADMIN ROUTES ---

// // Admin Login
// app.post('/api/admin/login', async (req, res) => {
//   const { email, password } = req.body;
//   const AUTHORIZED_ADMIN = process.env.ADMIN_EMAIL || "priyanshi@medicare.com";
//   const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

//   if (email === AUTHORIZED_ADMIN && password === ADMIN_PASSWORD) {
//     res.json({ success: true, message: "Admin Authenticated", token: "admin-secure-session-token" });
//   } else {
//     res.status(401).json({ success: false, message: "Unauthorized Entry" });
//   }
// });

// // Service Management
// app.post('/api/admin/add-service', async (req, res) => {
//   try {
//     let imageUrl = "";
//     if (req.files && req.files.image) {
//       const result = await cloudinary.uploader.upload(req.files.image.tempFilePath, { folder: 'medicare_services' });
//       imageUrl = result.secure_url;
//     }
//     const newService = new Service({
//       ...req.body,
//       instructions: req.body.instructions ? JSON.parse(req.body.instructions) : [],
//       slots: req.body.slots ? JSON.parse(req.body.slots) : [],
//       imageUrl
//     });
//     await newService.save();
//     res.status(201).json({ success: true, message: "Service added successfully!" });
//   } catch (err) { res.status(500).json({ success: false, error: err.message }); }
// });

// app.get('/api/admin/all-services', async (req, res) => {
//   try { res.json(await Service.find({}).sort({ createdAt: -1 })); } catch (err) { res.status(500).json({ error: "Failed to fetch services" }); }
// });

// app.get('/api/admin/service-appointments', async (req, res) => {
//   try { res.json(await ServiceBooking.find({}).sort({ createdAt: -1 })); } catch (err) { res.status(500).json({ error: "Failed to fetch service appointments" }); }
// });
// // server.js
// app.get('/api/services/user/:clerkId', async (req, res) => {
//   try {
//     const { clerkId } = req.params;
//     console.log("Fetching bookings for ID:", clerkId); // Debugging log

//     // We query by 'userId' because that's what we save in the POST route
//     const services = await ServiceBooking.find({ userId: clerkId }).sort({ createdAt: -1 });
    
//     console.log("Found services:", services.length); // Debugging log
//     res.json(services);
//   } catch (err) {
//     console.error("Fetch Error:", err);
//     res.status(500).json({ error: "Failed to fetch services" });
//   }
// });


// const PORT = 4000;
// app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));