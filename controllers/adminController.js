import Doctor from "../models/Doctor.js";
import User from "../models/User.js";
import Appointment from "../models/appointmentSchema.js";
import ServiceBooking from "../models/ServiceBooking.js";
import Service from "../models/Service.js";

// GET /api/admin/stats
export const getStats = async (req, res) => {
  try {
    const [totalDoctors, totalUsers, appointments] = await Promise.all([
      Doctor.countDocuments(),
      User.countDocuments(),
      Appointment.find(),
    ]);

    const totalAppointments = appointments.length;
    const completed = appointments.filter(a => a.status === "Completed").length;
    const totalEarnings = appointments
      .filter(a => a.status !== "Cancelled" && a.status !== "Canceled")
      .reduce((sum, a) => sum + (a.fees || 0), 0);

    res.json({ totalDoctors, totalUsers, totalAppointments, totalEarnings, completed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/admin/doctors-list
export const getDoctorsList = async (req, res) => {
  try {
    const [doctors, appointments] = await Promise.all([
      Doctor.find(),
      Appointment.find(),
    ]);

    const enriched = doctors.map(doc => {
      const docApts = appointments.filter(a => String(a.doctorId) === String(doc._id));
      const completedCount = docApts.filter(a => a.status === "Completed").length;
      const canceledCount  = docApts.filter(a => a.status === "Cancelled" || a.status === "Canceled").length;
      const totalEarnings  = docApts
        .filter(a => a.status !== "Cancelled" && a.status !== "Canceled")
        .reduce((sum, a) => sum + (a.fees || 0), 0);

      return {
        ...doc.toObject(),
        appointmentsCount: docApts.length,
        completedCount,
        canceledCount,
        totalEarnings,
      };
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/admin/all-appointments
export const getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find().sort({ createdAt: -1 });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/appointments/:id
export const updateAppointmentStatus = async (req, res) => {
  try {
    const updated = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Appointment not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/doctors/:id
export const deleteDoctor = async (req, res) => {
  try {
    const deleted = await Doctor.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Doctor not found" });
    res.json({ success: true, message: "Doctor removed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/admin/all-services
export const getAllServices = async (req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 });
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/admin/service-appointments
export const getServiceAppointments = async (req, res) => {
  try {
    const bookings = await ServiceBooking.find().sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/admin/service-stats
export const getServiceStats = async (req, res) => {
  try {
    const [services, bookings] = await Promise.all([
      Service.find(),
      ServiceBooking.find(),
    ]);

    const totalServices     = services.length;
    const totalAppointments = bookings.length;
    const completed         = bookings.filter(b => b.status === "Completed").length;
    const canceled          = bookings.filter(b => b.status === "Canceled" || b.status === "Cancelled").length;
    const totalEarning      = bookings
      .filter(b => b.status !== "Canceled" && b.status !== "Cancelled")
      .reduce((sum, b) => sum + (b.price || 0), 0);

    const serviceList = services.map(svc => {
      const svcBookings  = bookings.filter(b => b.serviceName === svc.name);
      const svcCompleted = svcBookings.filter(b => b.status === "Completed").length;
      const svcCanceled  = svcBookings.filter(b => b.status === "Canceled" || b.status === "Cancelled").length;
      const svcEarning   = svcBookings
        .filter(b => b.status !== "Canceled" && b.status !== "Cancelled")
        .reduce((sum, b) => sum + (b.price || 0), 0);

      return {
        _id:          svc._id,
        name:         svc.name,
        price:        svc.price,
        imageUrl:     svc.imageUrl,
        availability: svc.availability,
        appointments: svcBookings.length,
        completed:    svcCompleted,
        canceled:     svcCanceled,
        earning:      svcEarning,
      };
    });

    res.json({
      stats: { totalServices, totalAppointments, totalEarning, completed, canceled },
      serviceList,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
