import User from "../models/user.model.js";

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required" });
        }

        // Optional: check if user exists in your DB
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ success: false, message: "User with this email does not exist" });
        }

        // Send dummy password reset email via Brevo (Sendinblue) API
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
                to: [{ email: email }],
                subject: "Reset Your Expense Tracker Password",
                htmlContent: `
                    <h3>Password Reset Request</h3>
                    <p>Hi ${user.username},</p>
                    <p>This is a dummy password reset email from your Expense Tracker app.</p>
                `
            })
        });

        const data = await brevoResponse.json();
        if (!brevoResponse.ok) {
            console.error("Brevo error:", data);
            return res.status(500).json({ success: false, message: "Failed to send email" });
        }

        return res.status(200).json({
            success: true,
            message: "Password reset email sent successfully!"
        });
    } catch (error) {
        console.error("Forgot password error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};