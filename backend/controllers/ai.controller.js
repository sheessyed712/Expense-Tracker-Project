import { suggestExpenseCategory, generateSpendingInsights } from "../services/ai.service.js";
import Expense from "../models/expense.model.js";

export const categorizeExpense = async (req, res) => {
    try {
        const { description } = req.body;
        if (!description) {
            return res.status(400).json({ success: false, message: "Description is required" });
        }

        const category = await suggestExpenseCategory(description);
        return res.status(200).json({
            success: true,
            category
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "AI failed to suggest category" });
    }
};

export const getSpendingAdvice = async (req, res) => {
    try {
        const expenses = await Expense.findAll({ where: { UserId: req.user.id } });
        if (expenses.length === 0) {
            return res.status(200).json({ success: true, advice: "Add a few expenses first so AI can analyze your spending!" });
        }

        const advice = await generateSpendingInsights(expenses);
        return res.status(200).json({
            success: true,
            advice
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to generate AI insights" });
    }
};