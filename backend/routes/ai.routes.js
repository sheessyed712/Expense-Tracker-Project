import express from "express";
import { categorizeExpense, getSpendingAdvice } from "../controllers/ai.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/categorize", authenticate, categorizeExpense);
router.get("/insights", authenticate, getSpendingAdvice);

export default router;