import { connectDB } from "@/lib/db";
import Chat from "@/models/Chat";
import Document from "@/models/Document";
import { getUserFromRequest } from "@/lib/auth";

export async function DELETE(req) {
  try {
    await connectDB();

    const userId = getUserFromRequest(req);

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId } = await req.json();

    if (!chatId) {
      return Response.json(
        { error: "Missing chatId" },
        { status: 400 }
      );
    }

    const chat = await Chat.findOne({ _id: chatId, userId });

    if (!chat) {
      return Response.json({ error: "Chat not found" }, { status: 404 });
    }

    const fileId = chat.fileId;

    const result = await Chat.findOneAndDelete({ _id: chatId, userId });

    if (!result) {
      return Response.json({ error: "Chat not found" }, { status: 404 });
    }

    if (fileId) {
      const otherChatsWithFile = await Chat.countDocuments({
        fileId,
        userId,
      });

      if (otherChatsWithFile === 0) {
        await Document.findByIdAndDelete(fileId);
      }
    }

    return Response.json({ success: true, message: "Chat and associated document deleted" });
  } catch (error) {
    console.error("CHAT DELETE ERROR:", error);

    return Response.json(
      { error: "Failed to delete chat" },
      { status: 500 }
    );
  }
}
