// Handles expense CRUD operations and UI rendering

// Use BACKEND_URL from utils.js

let allExpenses = [];
let chart = null;

// Load all expenses from backend
async function loadExpenses() {
  expensesTable.innerHTML = '<tr><td colspan="6">Loading...</td></tr>';
  try {
    const res = await fetchWithAuth(`${BACKEND_URL}/api/expenses`);
    if (!res.ok) throw new Error("Failed to fetch expenses");
    const expenses = await res.json();
    allExpenses = expenses; // Store all expenses for filtering
    renderExpenses(filterExpenses(allExpenses));
  } catch (err) {
    expensesTable.innerHTML =
      '<tr><td colspan="6">Error loading expenses</td></tr>';
  }
}

// Filter and sort expenses based on search, filters, and sort dropdown
function filterExpenses(expenses) {
  const search =
    document.getElementById("searchInput")?.value.trim().toLowerCase() || "";
  const type = document.getElementById("typeFilter")?.value || "all";
  const dateFrom = document.getElementById("dateFrom")?.value;
  const dateTo = document.getElementById("dateTo")?.value;
  const sort = document.getElementById("sortDropdown")?.value || "date-desc";

  let filtered = expenses.filter((exp) => {
    // Search by title or category
    const matchesSearch =
      exp.title.toLowerCase().includes(search) ||
      exp.category.toLowerCase().includes(search);
    // Filter by type
    const matchesType = type === "all" || exp.type === type;
    // Filter by date range
    let matchesDate = true;
    if (dateFrom && exp.date) {
      matchesDate = exp.date.substring(0, 10) >= dateFrom;
    }
    if (matchesDate && dateTo && exp.date) {
      matchesDate = exp.date.substring(0, 10) <= dateTo;
    }
    return matchesSearch && matchesType && matchesDate;
  });

  // Sort filtered expenses
  filtered.sort((a, b) => {
    if (sort === "date-desc") {
      return (b.date || "").localeCompare(a.date || "");
    } else if (sort === "date-asc") {
      return (a.date || "").localeCompare(b.date || "");
    } else if (sort === "amount-desc") {
      return (parseFloat(b.amount) || 0) - (parseFloat(a.amount) || 0);
    } else if (sort === "amount-asc") {
      return (parseFloat(a.amount) || 0) - (parseFloat(b.amount) || 0);
    }
    return 0;
  });

  return filtered;
}

// Add event listeners to filter bar (include sort dropdown)
function setupFilters() {
  const searchInput = document.getElementById("searchInput");
  const typeFilter = document.getElementById("typeFilter");
  const dateFrom = document.getElementById("dateFrom");
  const dateTo = document.getElementById("dateTo");
  const sortDropdown = document.getElementById("sortDropdown");
  if (searchInput)
    searchInput.addEventListener("input", () =>
      renderExpenses(filterExpenses(allExpenses))
    );
  if (typeFilter)
    typeFilter.addEventListener("change", () =>
      renderExpenses(filterExpenses(allExpenses))
    );
  if (dateFrom)
    dateFrom.addEventListener("change", () =>
      renderExpenses(filterExpenses(allExpenses))
    );
  if (dateTo)
    dateTo.addEventListener("change", () =>
      renderExpenses(filterExpenses(allExpenses))
    );
  if (sortDropdown)
    sortDropdown.addEventListener("change", () =>
      renderExpenses(filterExpenses(allExpenses))
    );
}

// Export to CSV functionality
function exportExpensesToCSV(expenses) {
  if (!expenses.length) {
    alert("No expenses to export.");
    return;
  }
  const headers = ["Title", "Amount", "Type", "Category", "Date"];
  const rows = expenses.map((exp) => [
    '"' + exp.title.replace(/"/g, '""') + '"',
    exp.amount,
    exp.type,
    '"' + exp.category.replace(/"/g, '""') + '"',
    exp.date ? exp.date.substring(0, 10) : "",
  ]);
  let csvContent =
    headers.join(",") + "\n" + rows.map((r) => r.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "expenses.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

document.addEventListener("DOMContentLoaded", () => {
  if (!localStorage.getItem("token")) {
    window.location.href = "login.html";
    return;
  }
  setupFilters();
  loadExpenses();
  const exportBtn = document.getElementById("exportCsvBtn");
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      // Export currently filtered expenses
      exportExpensesToCSV(filterExpenses(allExpenses));
    });
  }
});

const expenseForm = document.getElementById("expenseForm");
const expensesTable = document
  .getElementById("expensesTable")
  .querySelector("tbody");
const messageDiv = document.getElementById("expenseMessage");
const cancelEditBtn = document.getElementById("cancelEdit");

// Render expenses in table
function renderExpenses(expenses) {
  if (!expenses.length) {
    expensesTable.innerHTML = '<tr><td colspan="6">No expenses found</td></tr>';
    updateSummary([]);
    return;
  }
  expensesTable.innerHTML = "";
  expenses.forEach((exp) => {
    const tr = document.createElement("tr");
    tr.className =
      exp.type === "income"
        ? "income-row"
        : exp.type === "expense"
        ? "expense-row"
        : "";
    tr.innerHTML = `
      <td>${exp.title}</td>
      <td>${exp.amount}</td>
      <td>${exp.type}</td>
      <td>${exp.category}</td>
      <td>${exp.date ? exp.date.substring(0, 10) : ""}</td>
      <td>
        <button onclick="editExpense('${exp._id}')">Edit</button>
        <button onclick="deleteExpense('${exp._id}')">Delete</button>
      </td>
    `;
    expensesTable.appendChild(tr);
  });
  updateSummary(expenses);
}

// Update summary section and chart
function updateSummary(expenses) {
  let totalIncome = 0;
  let totalExpense = 0;
  expenses.forEach((exp) => {
    const amt = parseFloat(exp.amount) || 0;
    if (exp.type === "income") totalIncome += amt;
    else if (exp.type === "expense") totalExpense += amt;
  });
  const balance = totalIncome - totalExpense;
  document.getElementById("totalIncome").textContent =
    "₹" + totalIncome.toFixed(2);
  document.getElementById("totalExpense").textContent =
    "₹" + totalExpense.toFixed(2);
  document.getElementById("balance").textContent = "₹" + balance.toFixed(2);

  // Update Chart.js pie chart or show placeholder
  const chartContainer = document.querySelector(".chart-container");
  if (totalIncome === 0 && totalExpense === 0) {
    // Remove chart if exists
    if (chart) {
      chart.destroy();
      chart = null;
    }
    // Show placeholder
    let placeholder = document.getElementById("chartPlaceholder");
    if (!placeholder) {
      placeholder = document.createElement("div");
      placeholder.id = "chartPlaceholder";
      placeholder.className = "chart-placeholder";
      placeholder.setAttribute("role", "status");
      placeholder.innerHTML = `
        <div class="placeholder-content">
          <span class="placeholder-icon" aria-hidden="true">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="6" y="18" width="4" height="8" rx="2" fill="#bbb"/>
              <rect x="14" y="12" width="4" height="14" rx="2" fill="#bbb"/>
              <rect x="22" y="8" width="4" height="18" rx="2" fill="#bbb"/>
            </svg>
          </span>
          <p class="placeholder-text">No data to display yet.<br>Add your first income or expense to see the breakdown!</p>
        </div>
      `;
      chartContainer.appendChild(placeholder);
    }
    // Hide canvas
    document.getElementById("incomeExpenseChart").style.display = "none";
    placeholder.style.display = "flex";
  } else {
    // Remove placeholder if exists
    const placeholder = document.getElementById("chartPlaceholder");
    if (placeholder) placeholder.style.display = "none";
    // Show canvas
    document.getElementById("incomeExpenseChart").style.display = "block";
    const ctx = document.getElementById("incomeExpenseChart").getContext("2d");
    const data = {
      labels: ["Income", "Expense"],
      datasets: [
        {
          data: [totalIncome, totalExpense],
          backgroundColor: ["#388e3c", "#d32f2f"],
          borderWidth: 1,
        },
      ],
    };
    if (chart) {
      chart.data = data;
      chart.update();
    } else {
      chart = new Chart(ctx, {
        type: "pie",
        data: data,
        options: {
          responsive: true,
          plugins: {
            legend: {
              display: true,
              position: "bottom",
            },
          },
        },
      });
    }
  }
}

// Handle add/edit expense form submit
if (expenseForm) {
  expenseForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("expenseId").value;
    const title = document.getElementById("title").value;
    const amount = document.getElementById("amount").value;
    const type = document.getElementById("type").value;
    const category = document.getElementById("category").value;
    const date = document.getElementById("date").value;
    messageDiv.textContent = "";
    try {
      let res, data;
      if (id) {
        // Edit expense
        res = await fetchWithAuth(`${BACKEND_URL}/api/expenses/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, amount, type, category, date }),
        });
        data = await res.json();
        if (res.ok) {
          messageDiv.style.color = "#388e3c";
          messageDiv.textContent = "Expense updated!";
        } else {
          messageDiv.style.color = "#d32f2f";
          messageDiv.textContent = data.message || "Update failed";
        }
      } else {
        // Add expense
        res = await fetchWithAuth(`${BACKEND_URL}/api/expenses`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, amount, type, category, date }),
        });
        data = await res.json();
        if (res.ok) {
          messageDiv.style.color = "#388e3c";
          messageDiv.textContent = "Expense added!";
        } else {
          messageDiv.style.color = "#d32f2f";
          messageDiv.textContent = data.message || "Add failed";
        }
      }
      expenseForm.reset();
      document.getElementById("expenseId").value = "";
      cancelEditBtn.style.display = "none";
      setTimeout(() => {
        messageDiv.textContent = "";
      }, 1200);
      loadExpenses();
    } catch (err) {
      messageDiv.style.color = "#d32f2f";
      messageDiv.textContent = "Network error";
    }
  });
}

// Edit expense: prefill form
window.editExpense = async function (id) {
  try {
    const res = await fetchWithAuth(`${BACKEND_URL}/api/expenses`);
    const expenses = await res.json();
    const exp = expenses.find((e) => e._id === id);
    if (exp) {
      document.getElementById("expenseId").value = exp._id;
      document.getElementById("title").value = exp.title;
      document.getElementById("amount").value = exp.amount;
      document.getElementById("type").value = exp.type;
      document.getElementById("category").value = exp.category;
      document.getElementById("date").value = exp.date
        ? exp.date.substring(0, 10)
        : "";
      cancelEditBtn.style.display = "inline-block";
    }
  } catch (err) {
    messageDiv.style.color = "#d32f2f";
    messageDiv.textContent = "Error loading expense";
  }
};

// Cancel edit
if (cancelEditBtn) {
  cancelEditBtn.addEventListener("click", () => {
    expenseForm.reset();
    document.getElementById("expenseId").value = "";
    cancelEditBtn.style.display = "none";
    messageDiv.textContent = "";
  });
}

// Delete expense
window.deleteExpense = async function (id) {
  if (!confirm("Delete this expense?")) return;
  try {
    const res = await fetchWithAuth(`${BACKEND_URL}/api/expenses/${id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (res.ok) {
      messageDiv.style.color = "#388e3c";
      messageDiv.textContent = "Expense deleted!";
      setTimeout(() => {
        messageDiv.textContent = "";
      }, 1200);
      loadExpenses();
    } else {
      messageDiv.style.color = "#d32f2f";
      messageDiv.textContent = data.message || "Delete failed";
    }
  } catch (err) {
    messageDiv.style.color = "#d32f2f";
    messageDiv.textContent = "Network error";
  }
};
