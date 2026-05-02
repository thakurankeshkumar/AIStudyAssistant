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

    const { chatId, fileId } = await req.json();

    if (!chatId || !fileId) {
      return Response.json(
        { error: "Missing chatId or fileId" },
        { status: 400 }
      );
    }

    const chat = await Chat.findOneAndUpdate(
      { _id: chatId, userId },
      { $set: { fileId } },
      { new: true }
    );

    if (!chat) {
      return Response.json({ error: "Chat not found" }, { status: 404 });
    }

    return Response.json({ chatId: chat._id, fileId: chat.fileId });
  } catch (error) {
    console.error("CHAT FILE ERROR:", error);

    return Response.json(
      { error: "Failed to attach file to chat" },
      { status: 500 }
    );
  }
}