import express from "express";
import { purchasePremium, updateTransactionStatus } from "../controllers/purchase.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/premiummembership", authenticate, purchasePremium);
router.get("/payment-status/:orderId", authenticate, updateTransactionStatus);

export default router;