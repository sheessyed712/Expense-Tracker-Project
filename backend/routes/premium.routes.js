import express from "express";
import { getUserLeaderboard } from "../controllers/premium.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/showLeaderboard", authenticate, getUserLeaderboard);

export default router;