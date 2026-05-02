import { connectDB } from "@/lib/db";
import Document from "@/models/Document";

export async function GET() {
  await connectDB();

  const testDoc = await Document.create({
    filename: "test.pdf",
    chunks: ["This is a test chunk"],
  });

  return Response.json(testDoc);
}