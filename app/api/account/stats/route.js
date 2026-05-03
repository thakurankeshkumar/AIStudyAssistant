import { connectDB } from "@/lib/db";
import Chat from "@/models/Chat";
import Document from "@/models/Document";
import User from "@/models/User";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req) {
  try {
    await connectDB();

    const userId = getUserFromRequest(req);

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user, chats, documentCount] = await Promise.all([
      User.findById(userId).select("name username stats createdAt"),
      Chat.find({ userId }).sort({ updatedAt: -1 }),
      Document.countDocuments({ userId }),
    ]);

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json({
      profile: {
        name: user.name || user.username,
        username: user.username,
        createdAt: user.createdAt,
      },
      stats: {
        chatsCreated: user.stats?.chatsCreated || 0,
        chatsDeleted: user.stats?.chatsDeleted || 0,
        filesUploaded: user.stats?.filesUploaded || 0,
        activeChats: chats.length,
        totalDocuments: documentCount,
      },
      chats,
    });
  } catch (error) {
    console.error("ACCOUNT STATS ERROR:", error);

    return Response.json(
      { error: "Failed to load account stats" },
      { status: 500 }
    );
  }
}
