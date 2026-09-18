import { acceptInvite, getUser, handleAuthCallback, login, recoverPassword, signup } from "@netlify/identity";

const loginForm = document.querySelector("#loginForm");
const passwordForm = document.querySelector("#passwordForm");
const signupForm = document.querySelector("#signupForm");
const message = document.querySelector("#message");
const showSignupBtn = document.querySelector("#showSignupBtn");
const showLoginBtn = document.querySelector("#showLoginBtn");

function show(messageText, kind = "") {
  message.textContent = messageText;
  message.dataset.kind = kind;
}

showSignupBtn?.addEventListener("click", () => {
  loginForm.hidden = true;
  signupForm.hidden = false;
  document.querySelector("#authTitle").textContent = "Új fiók létrehozása";
  document.querySelector("#authDescription").textContent = "Regisztráció után használhatod az ElectriQuote ajánlatkészítőjét.";
});

showLoginBtn?.addEventListener("click", () => {
  signupForm.hidden = true;
  loginForm.hidden = false;
  document.querySelector("#authTitle").textContent = "Belépés szükséges";
  document.querySelector("#authDescription").textContent = "Az ajánlatok és az előzmények csak bejelentkezés után érhetők el.";
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await login(loginForm.email.value.trim(), loginForm.password.value);
    window.location.href = "/";
  } catch (error) {
    show(error.message || "Sikertelen belépés.", "error");
  }
});

signupForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const user = await signup(signupForm.email.value.trim(), signupForm.password.value, { full_name: signupForm.name.value.trim() });
    show(user.emailVerified ? "A fiók létrejött, beléphetsz." : "Ellenőrizd az email-fiókodat a regisztráció befejezéséhez.", "success");
    signupForm.reset();
  } catch (error) {
    show(error.message || "A regisztráció sikertelen.", "error");
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
  const query = new URLSearchParams(window.location.search);
  for (const tokenName of ["invite_token", "recovery_token", "confirmation_token"]) {
    const token = query.get(tokenName);
    if (!window.location.hash && token) window.location.hash = `#${tokenName}=${encodeURIComponent(token)}`;
  }
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
