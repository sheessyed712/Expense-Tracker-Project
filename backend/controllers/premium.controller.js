import User from "../models/user.model.js";
import Expense from "../models/expense.model.js";
import sequelize from "../config/db.js";

export const getUserLeaderboard = async (req, res) => {
    try {
        // Optional security check: only allow premium users
        if (!req.user.isPremium) {
            return res.status(403).json({ success: false, message: "Premium membership required" });
        }

        const leaderboardOfUsers = await User.findAll({
            attributes: [
                "id",
                "username",
                [sequelize.fn("COALESCE", sequelize.fn("SUM", sequelize.col("Expenses.expenseAmount")), 0), "totalExpense"]
            ],
            include: [
                {
                    model: Expense,
                    attributes: []
                }
            ],
            group: ["User.id"],
            order: [[sequelize.literal("totalExpense"), "DESC"]]
        });

        return res.status(200).json({
            success: true,
            leaderboard: leaderboardOfUsers
        });
    } catch (error) {
        console.error("Leaderboard error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch leaderboard" });
    }
};