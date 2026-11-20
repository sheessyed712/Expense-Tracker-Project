import Expense from "../models/expense.model.js";
import TotalExpense from "../models/totalExpense.model.js";
import sequelize from "../config/db.js"; // <-- 1. Import sequelize for transactions



import DownloadedFile from "../models/downloadedFile.model.js";
import { uploadToS3 } from "../services/s3.service.js";


export const addExpense = async (req, res) => {
    // 2. Start a transaction
    const t = await sequelize.transaction();

    try {
        const { expenseAmount, description, category,note } = req.body;
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
                note,
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
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.max(1, Number(req.query.limit) || 10);
        const offset = (page - 1) * limit;
        // Fetch paginated expenses + total count for pagination buttons
        const { count, rows: expenses } = await Expense.findAndCountAll({
            where: { UserId: req.user.id },
            limit: limit,
            offset: offset,
            order: [["createdAt", "DESC"]] // Latest expenses first
        });

        const lastPage = Math.ceil(count / limit) || 1;

        return res.status(200).json({
            success: true,
            expenses,
            isPremium: req.user.isPremium,
            pagination: {
                currentPage: page,
                hasNextPage: page * limit < count,
                nextPage: page + 1,
                hasPreviousPage: page > 1,
                previousPage: page - 1,
                lastPage: lastPage,
                totalExpenses: count
            }
        });
    } catch (error) {
        console.error("Pagination fetch error:", error);
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








export const downloadExpenses = async (req, res) => {
    try {
        // 1. Check if user is Premium; return 401 Unauthorized if not
        if (!req.user.isPremium) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: Only premium users can download expenses"
            });
        }

        // 2. Query all expenses for this user
        const expenses = await Expense.findAll({
            where: { UserId: req.user.id },
            order: [["createdAt", "DESC"]]
        });

        // 3. Format expenses into CSV (or JSON string)
        let csvContent = "Date,Amount,Category,Description,Note\n";
        expenses.forEach(exp => {
            const dateStr = new Date(exp.createdAt).toISOString().split("T")[0];
            const note = exp.note ? exp.note.replace(/"/g, '""') : "";
            const desc = exp.description.replace(/"/g, '""');
            csvContent += `"${dateStr}",${exp.expenseAmount},"${exp.category}","${desc}","${note}"\n`;
        });

        // 4. Upload to AWS S3 with a unique filename per user + timestamp
        const filename = `Expense-${req.user.id}/${new Date().toISOString()}.csv`;
        const fileUrl = await uploadToS3(csvContent, filename);

        // 5. Save the S3 file URL in DownloadedFiles table (Bonus Task)
        await DownloadedFile.create({
            fileUrl,
            UserId: req.user.id
        });

        // 6. Fetch updated download history for this user
        const pastDownloads = await DownloadedFile.findAll({
            where: { UserId: req.user.id },
            order: [["createdAt", "DESC"]]
        });

        return res.status(200).json({
            success: true,
            fileUrl,
            pastDownloads
        });
    } catch (error) {
        console.error("S3 Download error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to generate and upload expense file"
        });
    }
};

export const getDownloadedFiles = async (req, res) => {
    try {
        if (!req.user.isPremium) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const pastDownloads = await DownloadedFile.findAll({
            where: { UserId: req.user.id },
            order: [["createdAt", "DESC"]]
        });
        return res.status(200).json({ success: true, pastDownloads });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to fetch download history" });
    }
};