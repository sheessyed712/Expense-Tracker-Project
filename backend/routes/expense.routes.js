import express from "express";
import { addExpense, deleteExpense, getExpenses ,downloadExpenses, getDownloadedFiles} from "../controllers/expense.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();



router.post("/addExpense", authenticate, addExpense);
router.get("/getExpenses", authenticate, getExpenses);
router.delete("/deleteExpense/:id", authenticate, deleteExpense);



router.get("/download", authenticate, downloadExpenses);
router.get("/downloads-history", authenticate, getDownloadedFiles);
export default router;