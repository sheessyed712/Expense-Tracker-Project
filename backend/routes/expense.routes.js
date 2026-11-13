import express from "express";
import { addExpense ,deleteExpense,getExpenses} from "../controllers/expense.controller.js";
const router=express.Router();

router.post("/addExpense",addExpense);
router.get("/getExpenses",getExpenses);
router.delete("/deleteExpense/:id",deleteExpense);

export default router;