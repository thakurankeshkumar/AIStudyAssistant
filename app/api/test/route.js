import { connectDB } from "@/lib/db";

export async function GET() {
  await connectDB();
  console.log("DB connected successfully");
  return Response.json({ message: "DB connected successfully" });
}