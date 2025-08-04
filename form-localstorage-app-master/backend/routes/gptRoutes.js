import express from "express";
import { analizzaTrascrizione } from "../controllers/gptController.js";

const router = express.Router();

router.post("/analizza", analizzaTrascrizione);

export default router;
