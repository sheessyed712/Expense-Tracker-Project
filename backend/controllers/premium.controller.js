import User from "../models/user.model.js";
import TotalExpense from "../models/totalExpense.model.js";

export const getUserLeaderboard = async (req, res) => {
    try {
        if (!req.user.isPremium) {
            return res.status(403).json({ success: false, message: "Premium membership required" });
        }

        // 1. Get all users along with their TotalExpense row (no Expense table needed!)
        const users = await User.findAll({
            attributes: ["id", "username"],
            include: [
                {
                    model: TotalExpense,
                    attributes: ["totalAmount"]
                }
            ]
        });

        // 2. Format the data cleanly (if a user has no TotalExpense row yet, their total is 0)
        const leaderboard = users.map(user => ({
            id: user.id,
            username: user.username,
            totalExpense: user.TotalExpense ? user.TotalExpense.totalAmount : 0
        }));

        // 3. Sort from highest totalExpense to lowest
        leaderboard.sort((a, b) => b.totalExpense - a.totalExpense);

        return res.status(200).json({
            success: true,
            leaderboard
        });
    } catch (error) {
        console.error("Leaderboard error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch leaderboard" });
    }
};