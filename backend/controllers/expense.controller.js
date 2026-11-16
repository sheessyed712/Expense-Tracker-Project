import Expense from "../models/expense.model.js";
import TotalExpense from "../models/totalExpense.model.js";

export const addExpense = async (req, res) => {
    try {
        const { expenseAmount, description, category } = req.body;
        if (!expenseAmount || !description || !category) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        // 1. Save the expense as usual
        const newExpense = await Expense.create({
            expenseAmount,
            description,
            category,
            UserId: req.user.id
        });

        // 2. Find this user's row in TotalExpenses (or create one with 0 if it's their first expense)
        const [userTotal] = await TotalExpense.findOrCreate({
            where: { UserId: req.user.id },
            defaults: { totalAmount: 0 }
        });

        // 3. Add the new expense amount to their existing total
        userTotal.totalAmount = Number(userTotal.totalAmount) + Number(expenseAmount);
        await userTotal.save();

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
        const expenses = await Expense.findAll({ where: { UserId: req.user.id } });
        return res.status(200).json({
            success: true,
            expenses,
            isPremium: req.user.isPremium
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Unable to fetch expenses" });
    }
};

export const deleteExpense = async (req, res) => {
    try {
        const expenseId = req.params.id;

        // 1. Find the expense first so we know its amount before deleting it
        const expense = await Expense.findOne({
            where: { id: expenseId, UserId: req.user.id }
        });

        if (!expense) {
            return res.status(404).json({ success: false, message: "Expense not found" });
        }

        // 2. Subtract its amount from TotalExpenses
        const userTotal = await TotalExpense.findOne({ where: { UserId: req.user.id } });
        if (userTotal) {
            userTotal.totalAmount = Number(userTotal.totalAmount) - Number(expense.expenseAmount);
            await userTotal.save();
        }

        // 3. Now delete the expense
        await expense.destroy();

        return res.status(200).json({
            success: true,
            message: "Expense deleted successfully"
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Unable to delete expense" });
    }
};