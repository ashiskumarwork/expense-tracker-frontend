// Backend base URL (shared by all scripts)
const BACKEND_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000"
    : "https://your-railway-or-render-backend-url";

// Helper function to make authenticated fetch requests
function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem("token");
  options.headers = options.headers || {};
  if (token) {
    options.headers["Authorization"] = "Bearer " + token;
  }
  return fetch(url, options);
}
