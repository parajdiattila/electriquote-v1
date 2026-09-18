export const handler = async (event) => {
  try {
    const { user = {} } = JSON.parse(event.body || "{}");
    return {
      statusCode: 200,
      body: JSON.stringify({
        app_metadata: {
          ...(user.app_metadata || {}),
          roles: ["member"],
        },
        user_metadata: user.user_metadata || {},
      }),
    };
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid signup event" }) };
  }
};
