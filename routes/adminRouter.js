import express from "express";
import {
  getStats,
  getDoctorsList,
  getAllAppointments,
  updateAppointmentStatus,
  deleteDoctor,
  getAllServices,
  getServiceAppointments,
  getServiceStats,
} from "../controllers/adminController.js";

const router = express.Router();

// Admin dashboard routes
router.get("/stats",                getStats);
router.get("/doctors-list",         getDoctorsList);
router.get("/all-appointments",     getAllAppointments);
router.get("/all-services",         getAllServices);
router.get("/service-appointments", getServiceAppointments);
router.get("/service-stats",        getServiceStats);

export default router;
