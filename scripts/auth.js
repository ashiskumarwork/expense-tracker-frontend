// Handles authentication logic: login, register, logout

// Redirect to dashboard if already logged in (for login/register pages)
if (
  (window.location.pathname.endsWith("login.html") ||
    window.location.pathname.endsWith("register.html")) &&
  localStorage.getItem("token")
) {
  window.location.href = "dashboard.html";
}

// Helper: Email validation
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Helper: Show/hide spinner
function showSpinner(form, show) {
  let spinner = form.querySelector(".spinner");
  if (!spinner) {
    spinner = document.createElement("div");
    spinner.className = "spinner";
    spinner.innerHTML = "";
    form.appendChild(spinner);
  }
  spinner.style.display = show ? "inline-block" : "none";
}

// Login form logic
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const messageDiv = document.getElementById("loginMessage");
    messageDiv.textContent = "";
    messageDiv.style.color = "#d32f2f";
    // Input validation
    if (!email || !password) {
      messageDiv.textContent = "Please fill in all fields.";
      return;
    }
    if (!isValidEmail(email)) {
      messageDiv.textContent = "Please enter a valid email address.";
      return;
    }
    showSpinner(loginForm, true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        messageDiv.style.color = "#388e3c";
        messageDiv.textContent = "Login successful! Redirecting...";
        localStorage.setItem("token", data.token);
        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 800);
      } else {
        messageDiv.textContent = data.message || "Login failed";
      }
    } catch (err) {
      messageDiv.textContent = "Network error";
    }
    showSpinner(loginForm, false);
  });
}

// Register form logic
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const messageDiv = document.getElementById("registerMessage");
    messageDiv.textContent = "";
    messageDiv.style.color = "#d32f2f";
    // Input validation
    if (!email || !password) {
      messageDiv.textContent = "Please fill in all fields.";
      return;
    }
    if (!isValidEmail(email)) {
      messageDiv.textContent = "Please enter a valid email address.";
      return;
    }
    if (password.length < 6) {
      messageDiv.textContent = "Password must be at least 6 characters.";
      return;
    }
    showSpinner(registerForm, true);
    try {
      // Send email and password to backend
      const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        messageDiv.style.color = "#388e3c";
        messageDiv.textContent = "Registration successful! Please login.";
        setTimeout(() => (window.location.href = "login.html"), 1200);
      } else {
        messageDiv.textContent = data.message || "Registration failed";
      }
    } catch (err) {
      messageDiv.textContent = "Network error";
    }
    showSpinner(registerForm, false);
  });
}

// Logout button logic
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "login.html";
  });
}
