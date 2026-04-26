import express from "express";
import { adminLogin, addNewAdmin } from "../controllers/useController.js";

const router = express.Router();

router.post("/login", adminLogin);
router.post("/addnew", addNewAdmin);

export default router;
