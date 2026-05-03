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

    if (!question || !chatId) {
      return Response.json(
        { error: "Missing question or chatId" },
        { status: 400 }
      );
    }

    const chat = await Chat.findOne({ _id: chatId, userId });

    if (!chat) {
      return Response.json({ error: "Chat not found" }, { status: 404 });
    }

    const activeFileId = fileId || chat.fileId;

    let prompt = `
    You are a helpful AI study assistant.

    Answer the question clearly and concisely:
    ${question}

    If the user has not provided study material, answer using your general knowledge.
    `;

    if (activeFileId) {
      const doc = await Document.findById(activeFileId);

      if (!doc) {
        return Response.json({ error: "Document not found" }, { status: 404 });
      }

      const contextChunks = doc.chunks.slice(0, 5).join(" ");

      prompt = `
      You are a helpful AI study assistant.

      Based ONLY on the following study material:
      ${contextChunks}

      Answer the question:
      ${question}

      the answer should be short and clean answer so that easy to understand and if the answer is not present or related to the material then also answer it based on you information and it should be accurate ".
      `;
    }

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
      ...(activeFileId ? { $set: { fileId: activeFileId } } : {}),
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