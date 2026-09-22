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
  // Netlify places invite/recovery tokens in the URL hash. Keep these links
  // on the auth page even if Identity has already created a temporary session;
  // otherwise the app could open before the user sets a password.
  const callbackNames = ["invite_token", "recovery_token", "confirmation_token"];
  const hasCallbackToken = callbackNames.some((name) => {
    const queryToken = new URLSearchParams(window.location.search).get(name);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    return Boolean(queryToken || hashParams.get(name));
  });
  if (hasCallbackToken) {
    requireLogin();
    throw new Error("auth-callback");
  }
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
