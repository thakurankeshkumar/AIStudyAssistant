import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function GET() {
  await connectDB();

  const user =
    (await User.findOne({ username: "testuser" })) ||
    (await User.create({
      username: "testuser",
      password: "123456",
    }));

  return Response.json(user);
}