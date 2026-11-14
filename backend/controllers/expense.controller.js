import Expense from "../models/expense.model.js";

export const addExpense = async (req, res) => {
    try {
        const { expenseAmount, description, category } = req.body;
        if (!expenseAmount || !description || !category) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        const newExpense = await Expense.create({
            expenseAmount,
            description,
            category,
            UserId: req.user.id // <-- Saves this expense under the logged-in user
        });

        return res.status(201).json({
            success: true,
            message: "Expense created successfully",
            newExpenseDetail: newExpense
        });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const getExpenses = async (req, res) => {
    try {
        // <-- Only fetches expenses belonging to the logged-in user
        const expenses = await Expense.findAll({ where: { UserId: req.user.id } });
        return res.status(200).json({
            success: true,
            expenses
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Unable to fetch expenses" });
    }
};

export const deleteExpense = async (req, res) => {
    try {
        const expenseId = req.params.id;
        // <-- Only deletes if the expense belongs to the logged-in user
        await Expense.destroy({
            where: { id: expenseId, UserId: req.user.id }
        });

        return res.status(200).json({
            success: true,
            message: "Expense deleted successfully"
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Unable to delete expense" });
    }
};