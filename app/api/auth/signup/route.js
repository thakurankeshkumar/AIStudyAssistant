import { connectDB } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(req) {
  try {
    await connectDB();

    const { name, username, password } = await req.json();

    if (!name || !username || !password) {
      return Response.json(
        { error: "Name, username and password required" },
        { status: 400 }
      );
    }

    // 🔹 Check if user exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return Response.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // 🔹 Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 🔹 Create user
    const user = await User.create({
      name,
      username,
      password: hashedPassword,
      stats: {
        chatsCreated: 0,
        chatsDeleted: 0,
        filesUploaded: 0,
      },
      firstTime: true,
    });

    // 🔹 Create JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 🔹 Send cookie
    return new Response(
      JSON.stringify({ message: "User created successfully" }),
      {
        status: 201,
        headers: {
          "Set-Cookie": `token=${token}; Path=/; HttpOnly; SameSite=Lax`,
          "Content-Type": "application/json",
        },
      }
    );

  } catch (error) {
    console.error("SIGNUP ERROR:", error);

    return Response.json(
      {
        error: "Signup failed",
        details: error.message,
      },
      { status: 500 }
    );
  }
}