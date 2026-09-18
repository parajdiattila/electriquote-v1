import { getUser, handleAuthCallback, login, logout, signup } from "@netlify/identity";

const form = document.querySelector("#loginForm");
const signupForm = document.querySelector("#signupForm");
const app = document.querySelector("#adminApp");
const authPanel = document.querySelector("#authPanel");
const status = document.querySelector("#status");
const usersList = document.querySelector("#usersList");
const inviteForm = document.querySelector("#inviteForm");

function showStatus(message, kind = "") {
  status.textContent = message;
  status.dataset.kind = kind;
}

function setLoggedIn(user) {
  authPanel.hidden = Boolean(user);
  app.hidden = !user;
  if (user) {
    document.querySelector("#adminEmail").textContent = user.email || "";
    loadUsers();
  }
}

async function loadUsers() {
  showStatus("Felhasználók betöltése...");
  const response = await fetch("/.netlify/functions/admin-users");
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Nem sikerült betölteni a felhasználókat.");
  usersList.innerHTML = data.users.map((user) => `
    <tr>
      <td>${escapeHtml(user.name || "—")}</td>
      <td>${escapeHtml(user.email || "—")}</td>
      <td>${user.roles?.includes("admin") || user.role === "admin" ? "Admin" : "Felhasználó"}</td>
      <td>${user.lastSignInAt ? new Date(user.lastSignInAt).toLocaleString("hu-HU") : "Még nem lépett be"}</td>
    </tr>`).join("") || '<tr><td colspan="4">Még nincs felhasználó.</td></tr>';
  showStatus(`${data.users.length} felhasználó`);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const user = await login(form.email.value.trim(), form.password.value);
    setLoggedIn(user);
    showStatus("Sikeres belépés.", "success");
  } catch (error) {
    showStatus(error.message || "Sikertelen belépés.", "error");
  }
});

signupForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const user = await signup(signupForm.email.value.trim(), signupForm.password.value, { full_name: signupForm.name.value.trim() });
    setLoggedIn(user);
    showStatus(user.emailVerified ? "Admin fiók létrejött." : "Ellenőrizd az email-fiókodat.", "success");
  } catch (error) {
    showStatus(error.message || "Sikertelen regisztráció.", "error");
  }
});

inviteForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const response = await fetch("/.netlify/functions/admin-users", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: inviteForm.email.value.trim(), name: inviteForm.name.value.trim() }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "A meghívó küldése sikertelen.");
    inviteForm.reset();
    showStatus("A belépési email elküldve.", "success");
    await loadUsers();
  } catch (error) {
    showStatus(error.message || "A meghívó küldése sikertelen.", "error");
  }
});

document.querySelector("#refreshBtn").addEventListener("click", () => void loadUsers().catch((error) => showStatus(error.message, "error")));
document.querySelector("#logoutBtn").addEventListener("click", async () => { await logout(); setLoggedIn(null); });

try {
  await handleAuthCallback();
  setLoggedIn(await getUser());
} catch (error) {
  showStatus(error.message || "A belépés nem érhető el.", "error");
}
