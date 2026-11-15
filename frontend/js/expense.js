const expenseForm = document.getElementById("expenseForm");
const message = document.getElementById("message");
const listOfExpenses = document.getElementById("listOfExpenses");


const token = localStorage.getItem("token");

// 1. If no token is found, kick them back to login page immediately
if (!token) {
    window.location.href = "./login.html";
}

// 2. Automatically attach the token to every axios request (GET, POST, DELETE)
axios.defaults.headers.common["Authorization"] = token;



// 1. Fetch old expenses on screen refresh
window.addEventListener("DOMContentLoaded", async () => {
    try {
        const response = await axios.get("http://localhost:5000/api/expense/getExpenses");
        response.data.expenses.forEach(expense => {
            addNewExpenseToUI(expense);
        });
    } catch (error) {
        console.log(error);
        showMessage("Failed to load expenses", "red");
    }
});

// 2. Add new expense form submit handler
expenseForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const expenseamount = document.getElementById("expenseamount").value.trim();
    const description = document.getElementById("description").value.trim();
    const category = document.getElementById("category").value;

    if (!expenseamount || !description || !category) {
        showMessage("All fields are required", "red");
        return;
    }

    const expenseData = {
        expenseAmount:expenseamount,
        description,
        category
    };

    try {
        const response = await axios.post("http://localhost:5000/api/expense/addExpense", expenseData);

        console.log(response.data);
        addNewExpenseToUI(response.data.newExpenseDetail);
        showMessage("Expense added successfully", "green");
        expenseForm.reset();

    } catch (error) {
        console.log(error);
        showMessage(
            error.response?.data?.message || "Something went wrong",
            "red"
        );
    }
});

// 3. Render expense item onto DOM
function addNewExpenseToUI(expense) {
    const expenseElemId = `expense-${expense.id}`;

    const li = document.createElement("li");
    li.id = expenseElemId;
    li.innerHTML = `
        ${expense.expenseAmount} - ${expense.category} - ${expense.description}
        <button onclick="deleteExpense(${expense.id})">Delete Expense</button>
    `;

    listOfExpenses.appendChild(li);
}

// 4. Delete expense handler
async function deleteExpense(expenseid) {
    try {
        await axios.delete(`http://localhost:5000/api/expense/deleteExpense/${expenseid}`);
        document.getElementById(`expense-${expenseid}`).remove();
        showMessage("Expense deleted", "green");
    } catch (error) {
        console.log(error);
        showMessage("Failed to delete expense", "red");
    }
}

function showMessage(text, color) {
    message.textContent = text;
    message.style.color = color;
}



const cashfree = Cashfree({
    mode: "sandbox"
});

document.getElementById("buyPremiumBtn").addEventListener("click", async () => {
    try {
        // 1. Create order in backend & get paymentSessionId
        const response = await axios.post("http://localhost:5000/api/purchase/premiummembership");
        const { paymentSessionId, orderId } = response.data;

        // 2. Open Cashfree checkout in modal
        const checkoutOptions = {
            paymentSessionId: paymentSessionId,
            redirectTarget: "_modal"
        };

        const result = await cashfree.checkout(checkoutOptions);

        // 3. Handle modal close/error or payment completion
        if (result.error) {
            console.log("Payment popup closed or error:", result.error);
            await axios.get(`http://localhost:5000/api/purchase/payment-status/${orderId}`);
            alert("TRANSACTION FAILED");
        }

        if (result.paymentDetails) {
            const statusRes = await axios.get(`http://localhost:5000/api/purchase/payment-status/${orderId}`);
            if (statusRes.data.orderStatus === "SUCCESSFUL") {
                alert("Transaction successful! You are now a Premium User.");
            } else {
                alert("TRANSACTION FAILED");
            }
        }
    } catch (error) {
        console.error("Purchase error:", error);
        alert("TRANSACTION FAILED");
    }
});