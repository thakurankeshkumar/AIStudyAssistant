import { connectDB } from "@/lib/db";
import Chat from "@/models/Chat";
import Document from "@/models/Document";
import User from "@/models/User";
import { getUserFromRequest } from "@/lib/auth";

export async function DELETE(req) {
  try {
    await connectDB();

    const userId = getUserFromRequest(req);

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findById(userId).select("_id");

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    await Document.deleteMany({ userId });

    await Chat.deleteMany({ userId });
    await User.findByIdAndDelete(userId);

    const response = Response.json({ success: true, message: "Account deleted" });
    response.headers.set("Set-Cookie", "token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");
    return response;
  } catch (error) {
    console.error("ACCOUNT DELETE ERROR:", error);

    return Response.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
