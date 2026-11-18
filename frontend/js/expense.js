const expenseForm = document.getElementById("expenseForm");
const message = document.getElementById("message");
const listOfExpenses = document.getElementById("listOfExpenses");


const note = document.getElementById("note").value.trim();
const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "./login.html";
}

axios.defaults.headers.common["Authorization"] = token;

// Store fetched expenses & dynamic pagination state from localStorage
let allUserExpenses = [];
let currentReportFilter = "daily";
let currentPage = 1;
let itemsPerPage = Number(localStorage.getItem("itemsPerPage")) || 10;

const rowsPerPageSelect = document.getElementById("rowsPerPage");

if (rowsPerPageSelect) {
    // Sync dropdown UI with the saved localStorage value on page load
    rowsPerPageSelect.value = String(itemsPerPage);

    // Save preference to localStorage and reload from Page 1 when changed
    rowsPerPageSelect.addEventListener("change", async (e) => {
        itemsPerPage = Number(e.target.value);
        localStorage.setItem("itemsPerPage", itemsPerPage);
        await fetchExpenses(1);
    });
}


// Load paginated expenses & check premium status on screen refresh
window.addEventListener("DOMContentLoaded", async () => {
    if (localStorage.getItem("isPremium") === "true") {
        showPremiumUserUI();
    }
    await fetchExpenses(1);
});

// Fetch a specific page of expenses using the user's chosen limit
async function fetchExpenses(page = 1) {
    try {
        currentPage = page;
        const response = await axios.get(
            `http://localhost:5000/api/expense/getExpenses?page=${page}&limit=${itemsPerPage}`
        );

        const { expenses, isPremium, pagination } = response.data;
        allUserExpenses = expenses || [];

        if (isPremium) {
            localStorage.setItem("isPremium", "true");
            showPremiumUserUI();
        }

        // Edge case guard: if user was on a page that no longer exists after changing limit
        if (pagination && pagination.totalExpenses > 0 && page > pagination.lastPage) {
            return await fetchExpenses(pagination.lastPage);
        }

        listOfExpenses.innerHTML = "";
        allUserExpenses.forEach(expense => {
            addNewExpenseToUI(expense);
        });

        renderPaginationButtons(pagination);
        renderReportTable(currentReportFilter);
    } catch (error) {
        console.log(error);
        showMessage("Failed to load expenses", "red");
    }
}
// Render Previous, Current, Next, and Last Page buttons
function renderPaginationButtons(pagination) {
    const container = document.getElementById("paginationControls");
    if (!container || !pagination) return;

    const {
        currentPage,
        hasPreviousPage,
        previousPage,
        hasNextPage,
        nextPage,
        lastPage,
        totalExpenses
    } = pagination;

    if (totalExpenses === 0) {
        container.innerHTML = "";
        return;
    }

    let buttonsHTML = `<span style="margin-right: 12px;">Total Expenses: <strong>${totalExpenses}</strong></span>`;

    if (hasPreviousPage) {
        buttonsHTML += `<button onclick="fetchExpenses(${previousPage})" style="margin-right: 6px;">Prev</button>`;
    }

    buttonsHTML += `<button style="font-weight: bold; background-color: #2c3e50; color: white; margin-right: 6px;">Page ${currentPage}</button>`;

    if (hasNextPage) {
        buttonsHTML += `<button onclick="fetchExpenses(${nextPage})" style="margin-right: 6px;">Next</button>`;
    }

    if (currentPage !== lastPage) {
        buttonsHTML += `<button onclick="fetchExpenses(${lastPage})">Last Page (${lastPage})</button>`;
    } else {
        buttonsHTML += `<span style="margin-left: 6px; color: #555;">(Last Page: ${lastPage})</span>`;
    }

    container.innerHTML = buttonsHTML;
}

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
        category,
        note
    };

    try {
        await axios.post("http://localhost:5000/api/expense/addExpense", expenseData);

        // Reload page 1 so the newest expense appears at the top and pagination updates
        await fetchExpenses(1);

        showMessage("Expense added successfully", "green");
        expenseForm.reset();
    } catch (error) {
        console.log(error);
        showMessage(error.response?.data?.message || "Something went wrong", "red");
    }
});

// Render expense item onto DOM
function addNewExpenseToUI(expense) {
    const expenseElemId = `expense-${expense.id}`;
    const noteText = expense.note ? ` (Note: ${expense.note})` : "";

    
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

        // Go back 1 page if the last remaining item on the current page was deleted
        const targetPage = allUserExpenses.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
        await fetchExpenses(targetPage);

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

// ==========================================
// PREMIUM UI, REPORT TABLE & DOWNLOAD BUTTON
// ==========================================
function showPremiumUserUI() {
    const buyBtn = document.getElementById("buyPremiumBtn");
    if (buyBtn) buyBtn.style.display = "none";

    const downloadBtn = document.getElementById("downloadExpenseBtn");
    if (downloadBtn) downloadBtn.disabled = false;

    const reportSection = document.getElementById("premiumReportSection");
    if (reportSection) reportSection.style.display = "block";

    const premiumContainer = document.getElementById("premiumFeatureContainer");
    premiumContainer.innerHTML = `
        <span>You are a premium user now</span>
        <button id="showLeaderboardBtn">Show Leaderboard</button>
    `;

    document.getElementById("showLeaderboardBtn").addEventListener("click", fetchAndShowLeaderboard);
    renderReportTable(currentReportFilter);
}

// Filter expenses & incomes by Daily, Weekly, or Monthly
function renderReportTable(filterType) {
    const tbody = document.getElementById("reportTableBody");
    if (!tbody) return;

    const now = new Date();
    const filtered = allUserExpenses.filter(item => {
        const itemDate = new Date(item.createdAt || Date.now());

        if (filterType === "daily") {
            return itemDate.toDateString() === now.toDateString();
        } else if (filterType === "weekly") {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(now.getDate() - 7);
            return itemDate >= sevenDaysAgo;
        } else if (filterType === "monthly") {
            return (
                itemDate.getMonth() === now.getMonth() &&
                itemDate.getFullYear() === now.getFullYear()
            );
        }
        return true;
    });

    tbody.innerHTML = "";
    let totalIncome = 0;
    let totalExpense = 0;

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No records found for this ${filterType} view.</td></tr>`;
    } else {
        filtered.forEach(item => {
            const dateStr = new Date(item.createdAt || Date.now()).toLocaleDateString();
            const amount = Number(item.expenseAmount);
            const isIncome = item.category.toLowerCase() === "salary";

            if (isIncome) {
                totalIncome += amount;
            } else {
                totalExpense += amount;
            }

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${dateStr}</td>
                <td>${item.description}</td>
                <td>${item.category}</td>
                <td>${isIncome ? "₹" + amount : "-"}</td>
                <td>${!isIncome ? "₹" + amount : "-"}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    document.getElementById("totalIncomeCell").textContent = `₹${totalIncome}`;
    document.getElementById("totalExpenseCell").textContent = `₹${totalExpense}`;
}

// Daily / Weekly / Monthly button click listeners
document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        currentReportFilter = btn.dataset.filter;
        renderReportTable(currentReportFilter);
    });
});

// Frontend CSV Download Button
document.getElementById("downloadExpenseBtn").addEventListener("click", () => {
    if (allUserExpenses.length === 0) {
        alert("No expenses available to download.");
        return;
    }

    let csvContent = "Date,Description,Category,Type,Amount\n";
    allUserExpenses.forEach(item => {
        const dateStr = new Date(item.createdAt || Date.now()).toLocaleDateString();
        const type = item.category.toLowerCase() === "salary" ? "Income" : "Expense";
        csvContent += `"${dateStr}","${item.description}","${item.category}","${type}",${item.expenseAmount}\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `expenses_${currentReportFilter}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

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
// AI FEATURES
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

aiSuggestBtn.addEventListener("click", autoDetectCategory);
descriptionInput.addEventListener("blur", autoDetectCategory);

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