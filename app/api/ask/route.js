import { connectDB } from "@/lib/db";
import Document from "@/models/Document";
import { Groq } from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req) {
  try {
    await connectDB();

    const { fileId, question } = await req.json();

    if (!fileId || !question) {
      return Response.json(
        { error: "Missing fileId or question" },
        { status: 400 }
      );
    }

    // 🔹 Fetch document
    const doc = await Document.findById(fileId);

    if (!doc) {
      return Response.json({ error: "Document not found" }, { status: 404 });
    }

    // 🔹 Simple retrieval (take first few chunks)
    const contextChunks = doc.chunks.slice(0, 5).join(" ");

    // 🔹 Build prompt
    const prompt = `
    You are a helpful AI study assistant.

    Based ONLY on the following study material:
    ${contextChunks}

    Answer the question:
    ${question}

    If the answer is not in the material, say "Not found in document".
    `;

    // 🔹 Call Groq API
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