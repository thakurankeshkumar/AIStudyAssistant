import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { getUserFromRequest } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function PUT(req) {
  try {
    await connectDB();

    const userId = getUserFromRequest(req);

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, oldPassword, newPassword } = await req.json();

    if (!name && !newPassword) {
      return Response.json(
        { error: "Provide a new name or password to update" },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    if (name) {
      const trimmedName = String(name).trim();

      if (!trimmedName) {
        return Response.json({ error: "Name cannot be empty" }, { status: 400 });
      }

      user.name = trimmedName;
    }

    if (newPassword) {
      if (!oldPassword) {
        return Response.json(
          { error: "Old password is required to set a new password" },
          { status: 400 }
        );
      }

      const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);

      if (!isOldPasswordValid) {
        return Response.json({ error: "Old password is incorrect" }, { status: 400 });
      }

      if (String(newPassword).length < 6) {
        return Response.json(
          { error: "New password must be at least 6 characters" },
          { status: 400 }
        );
      }

      user.password = await bcrypt.hash(newPassword, 10);
    }

    await user.save();

    return Response.json({
      message: "Account updated successfully",
      profile: {
        name: user.name,
        username: user.username,
      },
    });
  } catch (error) {
    console.error("ACCOUNT UPDATE ERROR:", error);

    return Response.json(
      { error: "Failed to update account" },
      { status: 500 }
    );
  }
}
