import { acceptInvite, getUser, handleAuthCallback, login, updateUser } from "@netlify/identity";

const loginForm = document.querySelector("#loginForm");
const passwordForm = document.querySelector("#passwordForm");
const message = document.querySelector("#message");

const translations = {
  hu: {
    title: "Belépés szükséges", description: "Az ajánlatok és az előzmények csak meghívott felhasználóknak érhetők el.", existingLogin: "Belépés meglévő fiókkal", email: "Email", password: "Jelszó", loginButton: "Belépés az ElectriQuote-ba →", activateTitle: "Fiók aktiválása", inviteDescription: "Az emailben kapott meghívó érvényes. Állítsd be a saját jelszavadat.", newPassword: "Új jelszó", confirmPassword: "Új jelszó ismétlése", activateButton: "Fiók aktiválása →", secureNote: "🔒 Biztonságos Netlify Identity belépés", pageTitle: "ElectriQuote – Belépés"
  },
  ro: {
    title: "Autentificare necesară", description: "Ofertele și istoricul sunt disponibile numai utilizatorilor invitați.", existingLogin: "Autentificare cu un cont existent", email: "Email", password: "Parolă", loginButton: "Intră în ElectriQuote →", activateTitle: "Activarea contului", inviteDescription: "Invitația primită prin email este valabilă. Setează-ți propria parolă.", newPassword: "Parolă nouă", confirmPassword: "Confirmă parola nouă", activateButton: "Activează contul →", secureNote: "🔒 Autentificare securizată Netlify Identity", pageTitle: "ElectriQuote – Autentificare"
  },
  en: {
    title: "Sign in required", description: "Quotes and history are available only to invited users.", existingLogin: "Sign in with an existing account", email: "Email", password: "Password", loginButton: "Sign in to ElectriQuote →", activateTitle: "Activate your account", inviteDescription: "Your email invitation is valid. Set your own password.", newPassword: "New password", confirmPassword: "Repeat new password", activateButton: "Activate account →", secureNote: "🔒 Secure Netlify Identity sign-in", pageTitle: "ElectriQuote – Sign in"
  }
};

function applyLanguage(lang = localStorage.getItem("villany-arajanlat-lang") || "hu") {
  const current = translations[lang] || translations.hu;
  document.documentElement.lang = lang;
  document.title = current.pageTitle;
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    if (current[key]) element.textContent = current[key];
  });
  const mode = passwordForm.dataset.mode;
  if (mode === "invite") {
    document.querySelector("#authTitle").textContent = current.activateTitle;
    document.querySelector("#authDescription").textContent = current.inviteDescription;
  } else if (mode === "recovery") {
    document.querySelector("#authTitle").textContent = lang === "ro" ? "Setează o parolă nouă" : lang === "en" ? "Set a new password" : "Új jelszó beállítása";
    document.querySelector("#authDescription").textContent = lang === "ro" ? "Setează o parolă nouă pentru contul tău." : lang === "en" ? "Set a new password for your account." : "Állíts be egy új jelszót a fiókodhoz.";
  }
}

window.addEventListener("app-language-change", (event) => applyLanguage(event.detail?.lang));
applyLanguage();

function show(messageText, kind = "") {
  message.textContent = messageText;
  message.dataset.kind = kind;
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await login(loginForm.email.value.trim(), loginForm.password.value);
    if (!(await getUser())) throw new Error("A bejelentkezési munkamenet nem jött létre.");
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
    // handleAuthCallback() already redeems recovery tokens and creates the
    // temporary authenticated session. Redeeming the same one again causes
    // Netlify to report that the user cannot be found.
    else await updateUser({ password: passwordForm.password.value });
    if (!(await getUser())) throw new Error("A fiók aktiválása sikerült, de a bejelentkezési munkamenet nem jött létre. Lépj be a beállított jelszóval.");
    window.location.href = "/";
  } catch (error) {
    show(error.message || "A jelszó beállítása sikertelen.", "error");
  }
});

try {
  const query = new URLSearchParams(window.location.search);
  for (const tokenName of ["invite_token", "recovery_token", "confirmation_token"]) {
    const token = query.get(tokenName);
    if (token) window.location.hash = `#${tokenName}=${encodeURIComponent(token)}`;
  }
  const callback = await handleAuthCallback();
  if (callback?.type === "invite" || callback?.type === "recovery") {
    loginForm.hidden = true;
    passwordForm.hidden = false;
    passwordForm.dataset.mode = callback.type;
    passwordForm.dataset.token = callback.token;
    applyLanguage();
  } else if (await getUser()) {
    window.location.href = "/";
  }
} catch (error) {
  show(error.message || "A belépés nem érhető el.", "error");
}
