import { getUser, onAuthChange } from "@netlify/identity";

function loginUrl() {
  const query = new URLSearchParams(window.location.search);
  const tokenNames = ["invite_token", "recovery_token", "confirmation_token"];
  const tokenName = tokenNames.find((name) => query.get(name));
  const token = tokenName ? query.get(tokenName) : null;
  const hash = tokenName && token
    ? `#${tokenName}=${encodeURIComponent(token)}`
    : window.location.hash;
  return `/login.html${hash}`;
}

function requireLogin() {
  document.documentElement.classList.remove("authorized");
  window.location.replace(loginUrl());
}

try {
  const user = await getUser();
  if (!user) {
    requireLogin();
  } else {
    document.documentElement.classList.add("authorized");
    onAuthChange((_event, currentUser) => {
      if (!currentUser) requireLogin();
    });
  }
} catch {
  requireLogin();
}
