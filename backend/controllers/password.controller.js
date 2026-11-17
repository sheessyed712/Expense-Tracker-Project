import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import ForgotPasswordRequest from "../models/forgotPasswordRequest.model.js";

// 1. Generate UUID, save in DB, and send email with reset link
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required" });
        }

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ success: false, message: "User with this email does not exist" });
        }

        // Generate a unique UUID and store it as active
        const id = uuidv4();
        await ForgotPasswordRequest.create({
            id,
            UserId: user.id,
            isActive: true
        });

        const resetUrl = `http://localhost:${process.env.PORT || 5000}/password/resetpassword/${id}`;
        console.log("Generated Reset URL:", resetUrl); // Helpful if email service is pending approval

        // Send email via Brevo
        const brevoResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
                "accept": "application/json",
                "api-key": process.env.BREVO_API_KEY,
                "content-type": "application/json"
            },
            body: JSON.stringify({
                sender: {
                    name: "Expense Tracker",
                    email: process.env.SENDER_EMAIL
                },
                to: [{ email }],
                subject: "Reset Your Expense Tracker Password",
                htmlContent: `
                    <h3>Password Reset Request</h3>
                    <p>Hi ${user.username},</p>
                    <p>Click the link below to reset your password:</p>
                    <a href="${resetUrl}">${resetUrl}</a>
                `
            })
        });

        if (!brevoResponse.ok) {
            const errData = await brevoResponse.json();
            console.error("Brevo error:", errData);
            return res.status(200).json({
                success: true,
                message: "Reset link generated (check backend console if email didn't arrive)",
                resetUrl
            });
        }

        return res.status(200).json({
            success: true,
            message: "Password reset link sent to your email!"
        });
    } catch (error) {
        console.error("Forgot password error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// 2. Verify UUID & isActive, then return the Reset Password HTML form
export const resetPassword = async (req, res) => {
    try {
        const { id } = req.params;

        const resetRequest = await ForgotPasswordRequest.findOne({ where: { id } });

        if (!resetRequest || !resetRequest.isActive) {
            return res.status(400).send("<h2>Invalid or expired password reset link!</h2>");
        }

        // Return an HTML form that submits the new password to POST /password/updatepassword/:id
        return res.status(200).send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>Reset Password</title>
            </head>
            <body style="font-family: Arial, sans-serif; padding: 40px;">
                <h2>Enter Your New Password</h2>
                <form action="/password/updatepassword/${id}" method="POST">
                    <label for="newpassword">New Password:</label><br><br>
                    <input type="password" id="newpassword" name="newpassword" required minlength="4" /><br><br>
                    <button type="submit">Reset Password</button>
                </form>
            </body>
            </html>
        `);
    } catch (error) {
        console.error("Reset password error:", error);
        return res.status(500).send("<h2>Something went wrong</h2>");
    }
};

// 3. Encrypt new password, update User, and set isActive = false
export const updatePassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { newpassword } = req.body;

        if (!newpassword) {
            return res.status(400).send("<h2>New password is required</h2>");
        }

        const resetRequest = await ForgotPasswordRequest.findOne({ where: { id } });

        if (!resetRequest || !resetRequest.isActive) {
            return res.status(400).send("<h2>This reset link has already been used or is invalid.</h2>");
        }

        const user = await User.findByPk(resetRequest.UserId);
        if (!user) {
            return res.status(404).send("<h2>User not found</h2>");
        }

        // Hash the new password before saving
        const hashedPassword = await bcrypt.hash(newpassword, 10);
        await user.update({ password: hashedPassword });

        // Deactivate the reset link so it cannot be reused
        await resetRequest.update({ isActive: false });

        return res.status(200).send(`
            <h2>Password updated successfully!</h2>
            <p>You can now go back to your <a href="http://127.0.0.1:5500/frontend/login.html">Login Page</a> and log in with your new password.</p>
        `);
    } catch (error) {
        console.error("Update password error:", error);
        return res.status(500).send("<h2>Failed to update password</h2>");
    }
};