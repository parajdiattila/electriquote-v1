import { acceptInvite, getUser, handleAuthCallback, login, recoverPassword } from "@netlify/identity";

const loginForm = document.querySelector("#loginForm");
const passwordForm = document.querySelector("#passwordForm");
const message = document.querySelector("#message");

function show(messageText, kind = "") {
  message.textContent = messageText;
  message.dataset.kind = kind;
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await login(loginForm.email.value.trim(), loginForm.password.value);
    window.location.href = "/";
  } catch (error) {
    show(error.message || "Sikertelen belépés.", "error");
  }
});

passwordForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const token = passwordForm.dataset.token;
    if (passwordForm.password.value !== passwordForm.confirm.value) throw new Error("A két jelszó nem egyezik.");
    if (passwordForm.dataset.mode === "invite") await acceptInvite(token, passwordForm.password.value);
    else await recoverPassword(token, passwordForm.password.value);
    window.location.href = "/";
  } catch (error) {
    show(error.message || "A jelszó beállítása sikertelen.", "error");
  }
});

try {
  const callback = await handleAuthCallback();
  const existingUser = await getUser();
  if (existingUser) window.location.href = "/";
  if (callback?.type === "invite" || callback?.type === "recovery") {
    loginForm.hidden = true;
    passwordForm.hidden = false;
    passwordForm.dataset.mode = callback.type;
    passwordForm.dataset.token = callback.token;
    document.querySelector("#authTitle").textContent = callback.type === "invite" ? "Fiók aktiválása" : "Új jelszó beállítása";
    document.querySelector("#authDescription").textContent = callback.type === "invite"
      ? "A meghívó érvényes. Állítsd be a saját jelszavadat az aktiváláshoz."
      : "Állíts be egy új jelszót a fiókodhoz.";
  }
} catch (error) {
  show(error.message || "A belépés nem érhető el.", "error");
}
