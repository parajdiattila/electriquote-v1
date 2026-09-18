import { admin, getUser, requestPasswordRecovery } from "@netlify/identity";

function json(data, status = 200) {
  return Response.json(data, { status });
}

function isAdmin(user) {
  return user && (user.role === "admin" || user.roles?.includes("admin"));
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    roles: user.roles || [],
    createdAt: user.createdAt,
    confirmedAt: user.confirmedAt,
    lastSignInAt: user.lastSignInAt,
  };
}

export default async (request) => {
  try {
    let currentUser;
    try {
      currentUser = await getUser();
    } catch {
      return json({ error: "Bejelentkezés szükséges." }, 401);
    }
    if (!currentUser) return json({ error: "Bejelentkezés szükséges." }, 401);
    if (!isAdmin(currentUser)) return json({ error: "Ehhez admin jogosultság szükséges." }, 403);

    if (request.method === "GET") {
      const users = await admin.listUsers({ perPage: 100 });
      return json({ users: users.map(publicUser) });
    }

    if (request.method === "POST") {
      const { email, name = "" } = await request.json();
      if (!email || !/^\S+@\S+\.\S+$/.test(email)) return json({ error: "Érvényes email-cím szükséges." }, 400);
      const temporaryPassword = `${crypto.randomUUID()}A9!`;
      const user = await admin.createUser({
        email,
        password: temporaryPassword,
        data: { app_metadata: { roles: ["member"] }, user_metadata: { full_name: name } },
      });
      await requestPasswordRecovery(email);
      return json({ user: publicUser(user) }, 201);
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (error) {
    console.error("Admin users error", error);
    return json({ error: error.message || "A felhasználókezelés nem érhető el." }, error.status || 500);
  }
};
