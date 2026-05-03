import {
  connectDB,
  databaseUnavailableResponse,
  isDatabaseConnectionError,
} from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await connectDB();

    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password required" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ username });
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // 🔹 Create JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 🔹 Set cookie
    return new Response(
      JSON.stringify({ message: "Login successful" }),
      {
        status: 200,
        headers: {
          // add SameSite + Secure for browser correctness
          "Set-Cookie": `token=${token}; Path=/; HttpOnly; SameSite=Lax`,
          "Content-Type": "application/json",
        },
      }
    );

    } catch (error) {
    console.error("LOGIN ERROR:", error);

    if (isDatabaseConnectionError(error)) {
      return databaseUnavailableResponse();
    }

    return NextResponse.json(
      { error: "Login failed", details: error.message },
      { status: 500 }
    );
  }
}
