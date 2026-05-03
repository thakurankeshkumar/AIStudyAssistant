import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req) {
  try {
    await connectDB();

    const userId = getUserFromRequest(req);

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findById(userId).select("name username");

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json({
      name: user.name || user.username,
      username: user.username,
    });
  } catch (error) {
    console.error("AUTH ME ERROR:", error);

    return Response.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}
