import { connectDB } from "@/lib/db";
import Document from "@/models/Document";
import { Groq } from "groq-sdk";
import Chat from "@/models/Chat";
import { getUserFromRequest } from "@/lib/auth";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req) {
  try {
    await connectDB();

    const { fileId, question, chatId } = await req.json();
    const userId = getUserFromRequest(req);

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!fileId || !question || !chatId) {
      return Response.json(
        { error: "Missing fileId, question or chatId" },
        { status: 400 }
      );
    }

    const doc = await Document.findById(fileId);

    if (!doc) {
      return Response.json({ error: "Document not found" }, { status: 404 });
    }

    const contextChunks = doc.chunks.slice(0, 5).join(" ");

    const prompt = `
    You are a helpful AI study assistant.

    Based ONLY on the following study material:
    ${contextChunks}

    Answer the question:
    ${question}

    If the answer is not in the material, say "Not found in document".
    `;

    const response = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    const answer = response.choices[0]?.message?.content;

    // ✅ FIXED: append instead of create
    await Chat.findByIdAndUpdate(chatId, {
      $push: {
        messages: [
          { role: "user", content: question },
          { role: "assistant", content: answer },
        ],
      },
    });

    return Response.json({ answer });

  } catch (error) {
    console.error("ASK ERROR:", error);

    return Response.json(
      {
        error: "Failed to get answer",
        details: error.message,
      },
      { status: 500 }
    );
  }
}