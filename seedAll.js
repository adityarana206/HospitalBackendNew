import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import Doctor from "./models/Doctor.js";
import User from "./models/User.js";
import Service from "./models/Service.js";
import ServiceBooking from "./models/ServiceBooking.js";
import Appointment from "./models/appointmentSchema.js";
import { Message } from "./models/messageSchema.js";

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
const DB_NAME = "MERN_HOSPITAL_MANAGEMENT_SYSTEM";

const seedAll = async () => {
  if (!MONGO_URI) {
    throw new Error("MONGODB_URI or MONGO_URI is required in .env");
  }

  await mongoose.connect(MONGO_URI, { dbName: DB_NAME });
  console.log("Connected to MongoDB:", DB_NAME);

  try {
    await Promise.all([
      Doctor.deleteMany({}),
      User.deleteMany({}),
      Service.deleteMany({}),
      ServiceBooking.deleteMany({}),
      Appointment.deleteMany({}),
      Message.deleteMany({}),
    ]);
    console.log("Cleared existing collections.");

    // ── Users ────────────────────────────────────────────────────────────────
    const users = await User.insertMany([
      {
        clerkId: "admin-001",
        email: "admin@medicare.com",
        name: "Admin Medicare",
        firstName: "Admin",
        lastName: "Medicare",
        appointments: [],
      },
      {
        clerkId: "patient-001",
        email: "amit.kumar@example.com",
        name: "Amit Kumar",
        firstName: "Amit",
        lastName: "Kumar",
        appointments: [],
      },
      {
        clerkId: "patient-002",
        email: "neha.singh@example.com",
        name: "Neha Singh",
        firstName: "Neha",
        lastName: "Singh",
        appointments: [],
      },
      {
        clerkId: "patient-003",
        email: "rahul.verma@example.com",
        name: "Rahul Verma",
        firstName: "Rahul",
        lastName: "Verma",
        appointments: [],
      },
      {
        clerkId: "patient-004",
        email: "sunita.mehra@example.com",
        name: "Sunita Mehra",
        firstName: "Sunita",
        lastName: "Mehra",
        appointments: [],
      },
    ]);
    console.log(`Seeded ${users.length} users.`);

    // ── Doctors ──────────────────────────────────────────────────────────────
    const doctors = await Doctor.insertMany([
      { name: "Dr. Maya Patel",    specialty: "Cardiology",       experience: 12, imageUrl: "/images/doctor1.jpg",  fees: 2500 },
      { name: "Dr. Rajesh Malhotra", specialty: "Neurology",      experience: 15, imageUrl: "/images/doctor2.jpg",  fees: 3000 },
      { name: "Dr. Priya Agrawal", specialty: "Pediatrics",       experience:  8, imageUrl: "/images/doctor3.jpeg", fees: 1800 },
      { name: "Dr. Suresh Iyer",   specialty: "Orthopedics",      experience: 18, imageUrl: "/images/doctor4.jpg",  fees: 2200 },
      { name: "Dr. Kavita Sharma", specialty: "Dermatology",      experience: 10, imageUrl: "/images/doctor5.jpg",  fees: 1500 },
      { name: "Dr. Arjun Nair",    specialty: "General Medicine", experience:  6, imageUrl: "/images/doctor6.jpg",  fees: 1000 },
    ]);
    console.log(`Seeded ${doctors.length} doctors.`);

    // ── Services ─────────────────────────────────────────────────────────────
    const services = await Service.insertMany([
      {
        name: "General Health Checkup",
        price: 1200,
        availability: "Available",
        description: "Complete body checkup for early detection of disorders.",
        imageUrl: "/images/service-checkup.jpg",
        instructions: ["Fast 8 hours before arrival", "Bring previous medical records", "Wear comfortable clothing"],
        slots: ["09:00 AM", "11:00 AM", "02:00 PM", "04:00 PM"],
      },
      {
        name: "Diabetes Screening",
        price: 1500,
        availability: "Available",
        description: "Blood sugar and HbA1c screening for diabetes management.",
        imageUrl: "/images/service-diabetes.jpg",
        instructions: ["Fast 10 hours before sample collection", "Avoid sugary foods the evening before", "Continue regular medications unless advised otherwise"],
        slots: ["08:30 AM", "10:00 AM", "12:00 PM", "03:00 PM"],
      },
      {
        name: "Cardiac Risk Profile",
        price: 2800,
        availability: "Available",
        description: "Advanced cardiac panel to assess heart disease risk factors.",
        imageUrl: "/images/service-cardiac.jpg",
        instructions: ["No caffeine 12 hours before test", "Stay hydrated", "Avoid strenuous exercise the day before"],
        slots: ["09:30 AM", "11:30 AM", "01:00 PM", "04:00 PM"],
      },
      {
        name: "Thyroid Profile",
        price: 950,
        availability: "Available",
        description: "Comprehensive TSH, T3, and T4 panel to evaluate thyroid function.",
        imageUrl: "/images/service-thyroid.jpg",
        instructions: ["Morning sample preferred", "Inform about current thyroid medications", "No fasting required"],
        slots: ["08:00 AM", "10:30 AM", "01:30 PM"],
      },
      {
        name: "Complete Blood Count (CBC)",
        price: 600,
        availability: "Available",
        description: "Full blood panel covering RBC, WBC, platelets, haemoglobin, and more.",
        imageUrl: "/images/service-cbc.jpg",
        instructions: ["Mild fast of 4 hours recommended", "Stay well hydrated", "Avoid alcohol 24 hours before"],
        slots: ["08:00 AM", "10:00 AM", "12:30 PM", "03:30 PM"],
      },
      {
        name: "Bone Density Scan (DEXA)",
        price: 3500,
        availability: "Available",
        description: "DEXA scan to measure bone mineral density and assess osteoporosis risk.",
        imageUrl: "/images/service-dexa.jpg",
        instructions: ["Avoid calcium supplements 24 hours before", "Remove metal jewellery", "Inform if pregnant"],
        slots: ["10:00 AM", "02:00 PM"],
      },
    ]);
    console.log(`Seeded ${services.length} services.`);

    // ── Appointments ─────────────────────────────────────────────────────────
    const appointments = await Appointment.insertMany([
      {
        userId:        users[1].clerkId,
        userEmail:     users[1].email,
        patientName:   "Amit Kumar",
        patientAge:    "34",
        patientGender: "Male",
        patientMobile: "9876543210",
        doctorName:    doctors[0].name,
        doctorId:      doctors[0]._id,
        specialty:     doctors[0].specialty,
        fees:          doctors[0].fees,
        appointmentDate: "2026-05-05",
        appointmentTime: "10:00 AM",
        paymentMethod: "Cash",
        status:        "Confirmed",
      },
      {
        userId:        users[2].clerkId,
        userEmail:     users[2].email,
        patientName:   "Neha Singh",
        patientAge:    "28",
        patientGender: "Female",
        patientMobile: "9123456789",
        doctorName:    doctors[1].name,
        doctorId:      doctors[1]._id,
        specialty:     doctors[1].specialty,
        fees:          doctors[1].fees,
        appointmentDate: "2026-05-07",
        appointmentTime: "02:00 PM",
        paymentMethod: "Online",
        status:        "Pending",
      },
      {
        userId:        users[3].clerkId,
        userEmail:     users[3].email,
        patientName:   "Rahul Verma",
        patientAge:    "45",
        patientGender: "Male",
        patientMobile: "9001122334",
        doctorName:    doctors[3].name,
        doctorId:      doctors[3]._id,
        specialty:     doctors[3].specialty,
        fees:          doctors[3].fees,
        appointmentDate: "2026-05-10",
        appointmentTime: "11:00 AM",
        paymentMethod: "Online",
        status:        "Confirmed",
      },
      {
        userId:        users[4].clerkId,
        userEmail:     users[4].email,
        patientName:   "Sunita Mehra",
        patientAge:    "52",
        patientGender: "Female",
        patientMobile: "9887766554",
        doctorName:    doctors[4].name,
        doctorId:      doctors[4]._id,
        specialty:     doctors[4].specialty,
        fees:          doctors[4].fees,
        appointmentDate: "2026-05-12",
        appointmentTime: "03:00 PM",
        paymentMethod: "Cash",
        status:        "Pending",
      },
      {
        userId:        users[1].clerkId,
        userEmail:     users[1].email,
        patientName:   "Amit Kumar",
        patientAge:    "34",
        patientGender: "Male",
        patientMobile: "9876543210",
        doctorName:    doctors[5].name,
        doctorId:      doctors[5]._id,
        specialty:     doctors[5].specialty,
        fees:          doctors[5].fees,
        appointmentDate: "2026-05-15",
        appointmentTime: "09:30 AM",
        paymentMethod: "Online",
        status:        "Cancelled",
      },
    ]);
    console.log(`Seeded ${appointments.length} appointments.`);

    // Link appointment IDs back to users
    await User.updateOne({ clerkId: users[1].clerkId }, { $set: { appointments: [appointments[0]._id, appointments[4]._id] } });
    await User.updateOne({ clerkId: users[2].clerkId }, { $set: { appointments: [appointments[1]._id] } });
    await User.updateOne({ clerkId: users[3].clerkId }, { $set: { appointments: [appointments[2]._id] } });
    await User.updateOne({ clerkId: users[4].clerkId }, { $set: { appointments: [appointments[3]._id] } });

    // ── Service Bookings ──────────────────────────────────────────────────────
    await ServiceBooking.insertMany([
      {
        userId:          users[1].clerkId,
        serviceName:     services[0].name,
        price:           services[0].price,
        imageUrl:        services[0].imageUrl,
        patientName:     "Amit Kumar",
        patientAge:      34,
        patientMobile:   "9876543210",
        appointmentDate: "2026-05-03",
        appointmentTime: "09:00 AM",
        status:          "Scheduled",
      },
      {
        userId:          users[2].clerkId,
        serviceName:     services[2].name,
        price:           services[2].price,
        imageUrl:        services[2].imageUrl,
        patientName:     "Neha Singh",
        patientAge:      28,
        patientMobile:   "9123456789",
        appointmentDate: "2026-05-04",
        appointmentTime: "01:00 PM",
        status:          "Scheduled",
      },
      {
        userId:          users[3].clerkId,
        serviceName:     services[1].name,
        price:           services[1].price,
        imageUrl:        services[1].imageUrl,
        patientName:     "Rahul Verma",
        patientAge:      45,
        patientMobile:   "9001122334",
        appointmentDate: "2026-05-06",
        appointmentTime: "08:30 AM",
        status:          "Completed",
      },
      {
        userId:          users[4].clerkId,
        serviceName:     services[3].name,
        price:           services[3].price,
        imageUrl:        services[3].imageUrl,
        patientName:     "Sunita Mehra",
        patientAge:      52,
        patientMobile:   "9887766554",
        appointmentDate: "2026-05-08",
        appointmentTime: "10:30 AM",
        status:          "Scheduled",
      },
      {
        userId:          users[1].clerkId,
        serviceName:     services[4].name,
        price:           services[4].price,
        imageUrl:        services[4].imageUrl,
        patientName:     "Amit Kumar",
        patientAge:      34,
        patientMobile:   "9876543210",
        appointmentDate: "2026-05-11",
        appointmentTime: "12:30 PM",
        status:          "Scheduled",
      },
    ]);
    console.log("Seeded 5 service bookings.");

    // ── Messages ─────────────────────────────────────────────────────────────
    await Message.insertMany([
      {
        firstName: "Rohan",
        lastName:  "Sharma",
        email:     "rohan.sharma@example.com",
        phone:     "9988776655",
        message:   "I would like to know the availability of cardiology appointments next week.",
      },
      {
        firstName: "Priya",
        lastName:  "Desai",
        email:     "priya.desai@example.com",
        phone:     "9876501234",
        message:   "Can I book a diabetes screening for my mother this Friday morning?",
      },
      {
        firstName: "Vikas",
        lastName:  "Gupta",
        email:     "vikas.gupta@example.com",
        phone:     "9845012345",
        message:   "What documents are required for the complete health checkup package?",
      },
      {
        firstName: "Meera",
        lastName:  "Iyer",
        email:     "meera.iyer@example.com",
        phone:     "9765432100",
        message:   "Please let me know if home sample collection is available for the CBC test.",
      },
    ]);
    console.log("Seeded 4 messages.");

    console.log("\n✅ All collections seeded successfully.");
    console.log(`   Admin login : admin@medicare.com`);
    console.log(`   Doctors     : ${doctors.length}`);
    console.log(`   Services    : ${services.length}`);
    console.log(`   Appointments: ${appointments.length}`);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed.");
  }
};

seedAll();
