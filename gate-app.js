import { getUser } from "@netlify/identity";

try {
  const user = await getUser();
  if (!user) {
    window.location.replace("/login.html");
  } else {
    document.documentElement.classList.add("authorized");
  }
} catch {
  window.location.replace("/login.html");
}
