import { connectDB } from "@/lib/db";
import Chat from "@/models/Chat";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req) {
    try {
        await connectDB();

        const userId = getUserFromRequest(req);

        // ✅ Fix 1: auth check
        if (!userId) {
            return Response.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const chat = await Chat.create({
            userId,
            title: "New Chat", // ✅ Fix 2
            messages: [],
        });

        return Response.json({ chatId: chat._id });

    } catch (error) {
        console.error("CREATE CHAT ERROR:", error);

        return Response.json(
            { error: "Failed to create chat" },
            { status: 500 }
        );
    }
}