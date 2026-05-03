import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req) {
  try {
    await connectDB();

    const userId = getUserFromRequest(req);

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { firstTime: false },
      { new: true }
    );

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json({
      message: "Welcome page acknowledged",
      firstTime: user.firstTime,
    });
  } catch (error) {
    console.error("WELCOME ERROR:", error);

    return Response.json(
      { error: "Failed to update welcome status" },
      { status: 500 }
    );
  }
}
