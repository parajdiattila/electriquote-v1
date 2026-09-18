import { getStore } from "@netlify/blobs";
import { getUser } from "@netlify/identity";

const store = getStore("electriquote-history", { consistency: "strong" });

function quoteKey(id) {
  return `shared/${encodeURIComponent(String(id))}.json`;
}

function json(data, status = 200) {
  return Response.json(data, { status });
}

function validEntry(entry) {
  return entry && typeof entry === "object" && /^[a-zA-Z0-9_-]{8,160}$/.test(String(entry.id)) && entry.payload;
}

export default async (request) => {
  const id = new URL(request.url).searchParams.get("id");

  try {
    const user = await getUser();
    if (!user || (!user.roles?.includes("member") && !user.roles?.includes("admin") && user.role !== "admin")) {
      return json({ error: "Bejelentkezés szükséges." }, 401);
    }
    if (request.method === "GET") {
      const listed = await store.list();
      const quotes = (await Promise.all(
        listed.blobs.map(async ({ key }) => store.get(key, { type: "json" })),
      )).filter(Boolean);
      return json({ quotes });
    }

    if (request.method === "POST" || request.method === "PUT") {
      const entry = await request.json();
      if (!validEntry(entry) || (request.method === "PUT" && String(entry.id) !== String(id))) {
        return json({ error: "Invalid quote" }, 400);
      }
      await store.setJSON(quoteKey(entry.id), entry);
      return json({ quote: entry }, request.method === "POST" ? 201 : 200);
    }

    if (request.method === "DELETE") {
      if (!id || !/^[a-zA-Z0-9_-]{8,160}$/.test(id)) return json({ error: "Invalid id" }, 400);
      const listed = await store.list();
      const encodedId = `${encodeURIComponent(String(id))}.json`;
      await Promise.all(
        listed.blobs
          .filter(({ key }) => key === quoteKey(id) || key.endsWith(`/${encodedId}`))
          .map(({ key }) => store.delete(key)),
      );
      return json({ ok: true });
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (error) {
    console.error("Quote history error", error);
    return json({ error: "History service unavailable" }, 500);
  }
};
