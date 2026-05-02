export async function POST() {
  try {
    return new Response(
      JSON.stringify({ message: "Logged out successfully" }),
      {
        status: 200,
        headers: {
          // 🔥 Clear cookie
          "Set-Cookie": "token=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax",
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("LOGOUT ERROR:", error);

    return Response.json(
      { error: "Logout failed" },
      { status: 500 }
    );
  }
}