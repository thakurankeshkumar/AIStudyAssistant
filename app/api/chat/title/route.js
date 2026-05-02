import { connectDB } from "@/lib/db";
import Chat from "@/models/Chat";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req) {
  try {
    await connectDB();

    const userId = getUserFromRequest(req);

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId, title } = await req.json();

    if (!chatId || !title) {
      return Response.json(
        { error: "Missing chatId or title" },
        { status: 400 }
      );
    }

    const chat = await Chat.findOneAndUpdate(
      { _id: chatId, userId },
      { $set: { title } },
      { new: true }
    );

    if (!chat) {
      return Response.json({ error: "Chat not found" }, { status: 404 });
    }

    return Response.json({ chatId: chat._id, title: chat.title });
  } catch (error) {
    console.error("CHAT TITLE UPDATE ERROR:", error);

    return Response.json(
      { error: "Failed to update chat title" },
      { status: 500 }
    );
  }
}
