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

// Load old expenses & check premium status on screen refresh
window.addEventListener("DOMContentLoaded", async () => {
    if (localStorage.getItem("isPremium") === "true") {
        showPremiumUserUI();
    }

    try {
        const response = await axios.get("http://localhost:5000/api/expense/getExpenses");
        if (response.data.isPremium) {
            localStorage.setItem("isPremium", "true");
            showPremiumUserUI();
        }
        response.data.expenses.forEach(expense => {
            addNewExpenseToUI(expense);
        });
    } catch (error) {
        console.log(error);
        showMessage("Failed to load expenses", "red");
    }
});

// Add new expense form submit handler
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
        expenseAmount: expenseamount,
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

// Render expense item onto DOM
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

// Delete expense handler
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

// Cashfree Payment Integration
const cashfree = Cashfree({
    mode: "sandbox"
});

document.getElementById("buyPremiumBtn").addEventListener("click", async () => {
    try {
        const response = await axios.post("http://localhost:5000/api/purchase/premiummembership");
        const { paymentSessionId, orderId } = response.data;

        const checkoutOptions = {
            paymentSessionId: paymentSessionId,
            redirectTarget: "_modal"
        };

        const result = await cashfree.checkout(checkoutOptions);

        if (result.error) {
            console.log("Payment popup closed or error:", result.error);
            await axios.get(`http://localhost:5000/api/purchase/payment-status/${orderId}`);
            alert("TRANSACTION FAILED");
        }

        if (result.paymentDetails) {
            const statusRes = await axios.get(`http://localhost:5000/api/purchase/payment-status/${orderId}`);
            if (statusRes.data.orderStatus === "SUCCESSFUL") {
                alert("Transaction successful! You are now a Premium User.");
                localStorage.setItem("isPremium", "true");
                showPremiumUserUI();
            } else {
                alert("TRANSACTION FAILED");
            }
        }
    } catch (error) {
        console.error("Purchase error:", error);
        alert("TRANSACTION FAILED");
    }
});

// Premium UI & Leaderboard
function showPremiumUserUI() {
    const buyBtn = document.getElementById("buyPremiumBtn");
    if (buyBtn) buyBtn.style.display = "none";

    const premiumContainer = document.getElementById("premiumFeatureContainer");
    premiumContainer.innerHTML = `
        <span>You are a premium user now</span>
        <button id="showLeaderboardBtn">Show Leaderboard</button>
    `;

    document.getElementById("showLeaderboardBtn").addEventListener("click", fetchAndShowLeaderboard);
}

async function fetchAndShowLeaderboard() {
    try {
        const response = await axios.get("http://localhost:5000/api/premium/showLeaderboard");
        const leaderboardSection = document.getElementById("leaderboardSection");

        let listItems = "";
        response.data.leaderboard.forEach(user => {
            listItems += `<li>Name - ${user.username} Total Expense - ${user.totalExpense}</li>`;
        });

        leaderboardSection.innerHTML = `
            <h2>Leader Board</h2>
            <ul>${listItems}</ul>
        `;
    } catch (error) {
        console.error("Failed to fetch leaderboard:", error);
        showMessage("Failed to load leaderboard", "red");
    }
}

// ==========================================
// AI FEATURES (Auto-Category & Spending Coach)
// ==========================================
const descriptionInput = document.getElementById("description");
const categorySelect = document.getElementById("category");
const aiSuggestBtn = document.getElementById("aiSuggestBtn");

async function autoDetectCategory() {
    const description = descriptionInput.value.trim();
    if (!description) return;

    aiSuggestBtn.textContent = "Thinking...";
    try {
        const response = await axios.post("http://localhost:5000/api/ai/categorize", { description });
        const suggestedCategory = response.data.category;

        // Add option dynamically if AI returns a category not already in the dropdown
        const optionExists = Array.from(categorySelect.options).some(opt => opt.value === suggestedCategory);
        if (!optionExists) {
            const newOption = new Option(suggestedCategory, suggestedCategory);
            categorySelect.add(newOption);
        }

        categorySelect.value = suggestedCategory;
        showMessage(`AI suggested category: ${suggestedCategory}`, "green");
    } catch (error) {
        console.error("AI suggest error:", error);
    } finally {
        aiSuggestBtn.textContent = "✨ Auto-Detect Category";
    }
}

// Trigger AI categorization on button click OR when user finishes typing description
aiSuggestBtn.addEventListener("click", autoDetectCategory);
descriptionInput.addEventListener("blur", autoDetectCategory);

// AI Spending Insights button handler
document.getElementById("aiInsightsBtn").addEventListener("click", async () => {
    const box = document.getElementById("aiInsightsBox");
    box.textContent = "Analyzing your expenses with Gemini AI...";
    try {
        const response = await axios.get("http://localhost:5000/api/ai/insights");
        box.textContent = response.data.advice;
    } catch (error) {
        console.error("AI insights error:", error);
        box.textContent = "Could not load AI insights right now.";
    }
});