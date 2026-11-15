import { Cashfree, CFEnvironment } from "cashfree-pg";

const cashfree = new Cashfree(
    CFEnvironment.SANDBOX,
    process.env.CASHFREE_APP_ID || "TEST430329ae80e0f32e41a393d78b923034",
    process.env.CASHFREE_SECRET_KEY || "TESTaf195616268bd6202eeb3bf8dc458956e7192a85"
);

export const createCashfreeOrder = async (orderId, orderAmount, customerId, customerPhone) => {
    try {
        const expiryDate = new Date(Date.now() + 60 * 60 * 1000);
        const formattedExpiryDate = expiryDate.toISOString();

        const request = {
            order_amount: orderAmount,
            order_currency: "INR",
            order_id: orderId,
            customer_details: {
                customer_id: String(customerId),
                customer_phone: customerPhone || "9999999999"
            },
            order_meta: {
                return_url: `http://localhost:5000/api/purchase/payment-status/${orderId}`,
                payment_methods: "cc,dc,upi"
            },
            order_expiry_time: formattedExpiryDate
        };

        const response = await cashfree.PGCreateOrder(request);
        return response.data.payment_session_id;
    } catch (error) {
        console.error("Error creating Cashfree order:", error.response?.data || error.message);
        throw error;
    }
};

export const getPaymentStatusFromCashfree = async (orderId) => {
    try {
        // Takes only one parameter (orderId) as noted in your instructions
        const response = await cashfree.PGOrderFetchPayments(orderId);
        const transactions = response.data;

        if (transactions.some(txn => txn.payment_status === "SUCCESS")) {
            return "SUCCESSFUL";
        } else if (transactions.some(txn => txn.payment_status === "PENDING")) {
            return "PENDING";
        } else {
            return "FAILED";
        }
    } catch (error) {
        console.error("Error fetching payment status:", error.response?.data || error.message);
        return "FAILED";
    }
};