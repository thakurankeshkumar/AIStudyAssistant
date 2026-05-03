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
      {
        $set: {
          "stats.chatsCreated": 0,
          "stats.chatsDeleted": 0,
          "stats.filesUploaded": 0,
        },
      },
      { new: true }
    );

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json({
      message: "Stats reset successfully",
      stats: user.stats,
    });
  } catch (error) {
    console.error("RESET STATS ERROR:", error);

    return Response.json(
      { error: "Failed to reset stats" },
      { status: 500 }
    );
  }
}
