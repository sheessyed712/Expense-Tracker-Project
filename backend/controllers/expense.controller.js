import Expense from "../models/expense.model.js";
import TotalExpense from "../models/totalExpense.model.js";
import sequelize from "../config/db.js"; // <-- 1. Import sequelize for transactions

export const addExpense = async (req, res) => {
    // 2. Start a transaction
    const t = await sequelize.transaction();

    try {
        const { expenseAmount, description, category } = req.body;
        if (!expenseAmount || !description || !category) {
            await t.rollback();
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        // 3. Save the expense inside the transaction
        const newExpense = await Expense.create(
            {
                expenseAmount,
                description,
                category,
                UserId: req.user.id
            },
            { transaction: t }
        );

        // 4. Find or create this user's TotalExpense row inside the transaction
        const [userTotal] = await TotalExpense.findOrCreate({
            where: { UserId: req.user.id },
            defaults: { totalAmount: 0 },
            transaction: t
        });

        // 5. Update totalAmount inside the transaction
        userTotal.totalAmount = Number(userTotal.totalAmount) + Number(expenseAmount);
        await userTotal.save({ transaction: t });

        // 6. Everything succeeded — commit both changes to the database
        await t.commit();

        return res.status(201).json({
            success: true,
            message: "Expense created successfully",
            newExpenseDetail: newExpense
        });
    } catch (error) {
        // 7. Anything failed — undo all database changes from this request
        await t.rollback();
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
    // 1. Start a transaction
    const t = await sequelize.transaction();

    try {
        const expenseId = req.params.id;

        // 2. Find the expense inside the transaction
        const expense = await Expense.findOne({
            where: { id: expenseId, UserId: req.user.id },
            transaction: t
        });

        if (!expense) {
            await t.rollback();
            return res.status(404).json({ success: false, message: "Expense not found" });
        }

        // 3. Subtract its amount from TotalExpenses inside the transaction
        const userTotal = await TotalExpense.findOne({
            where: { UserId: req.user.id },
            transaction: t
        });

        if (userTotal) {
            userTotal.totalAmount = Number(userTotal.totalAmount) - Number(expense.expenseAmount);
            await userTotal.save({ transaction: t });
        }

        // 4. Delete the expense inside the transaction
        await expense.destroy({ transaction: t });

        // 5. Commit both changes together
        await t.commit();

        return res.status(200).json({
            success: true,
            message: "Expense deleted successfully"
        });
    } catch (error) {
        // 6. Anything failed — undo both the total update and the delete
        await t.rollback();
        return res.status(500).json({ success: false, message: "Unable to delete expense" });
    }
};