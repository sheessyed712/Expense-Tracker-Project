import Order from "../models/order.model.js";
import { createCashfreeOrder, getPaymentStatusFromCashfree } from "../services/cashfree.service.js";

export const purchasePremium = async (req, res) => {
    try {
        const orderId = `ORDER_${req.user.id}_${Date.now()}`;
        const orderAmount = 99; // Amount in INR

        const paymentSessionId = await createCashfreeOrder(
            orderId,
            orderAmount,
            req.user.id,
            "9876543210"
        );

        // Save order in DB with status PENDING
        await Order.create({
            orderId,
            paymentSessionId,
            status: "PENDING",
            UserId: req.user.id
        });

        return res.status(201).json({
            success: true,
            paymentSessionId,
            orderId
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to initiate premium purchase"
        });
    }
};

export const updateTransactionStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findOne({ where: { orderId, UserId: req.user.id } });

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        const status = await getPaymentStatusFromCashfree(orderId);

        if (status === "SUCCESSFUL") {
            await order.update({ status: "SUCCESSFUL" });
            await req.user.update({ isPremium: true });
            return res.status(200).json({
                success: true,
                orderStatus: "SUCCESSFUL",
                message: "Transaction successful"
            });
        } else {
            await order.update({ status: "FAILED" });
            return res.status(200).json({
                success: false,
                orderStatus: "FAILED",
                message: "TRANSACTION FAILED"
            });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            orderStatus: "FAILED",
            message: "TRANSACTION FAILED"
        });
    }
};