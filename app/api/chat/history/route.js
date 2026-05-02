import { connectDB } from "@/lib/db";
import Chat from "@/models/Chat";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req) {
  try {
    await connectDB();

    const userId = getUserFromRequest(req);

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const chats = await Chat.find({ userId })
      .sort({ createdAt: -1 })
      .limit(20);

    return Response.json(chats);

  } catch (error) {
    console.error("HISTORY ERROR:", error);

    return Response.json(
      { error: "Failed to fetch chats" },
      { status: 500 }
    );
  }
}