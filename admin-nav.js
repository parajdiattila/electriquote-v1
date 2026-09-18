import { getUser } from "@netlify/identity";

const button = document.querySelector("#adminUsersBtn");
try {
  const user = await getUser();
  if (user?.role === "admin" || user?.roles?.includes("admin")) button.hidden = false;
} catch {
  // The protected app gate handles unauthenticated visitors.
}
