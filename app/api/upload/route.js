import { connectDB } from "@/lib/db";
import Document from "@/models/Document";
import User from "@/models/User";
import { getUserFromRequest } from "@/lib/auth";
import { PDFParse } from "pdf-parse";
import "pdfjs-dist/legacy/build/pdf.worker.mjs";

export async function POST(req) {
    try {
        await connectDB();

        const userId = getUserFromRequest(req);

        if (!userId) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const contentType = req.headers.get("content-type") || "";
        let fileName = "uploaded.pdf";
        let buffer;

        if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
            const formData = await req.formData();
            const file = formData.get("file");

            if (!file || typeof file.arrayBuffer !== "function") {
                return Response.json({ error: "No file uploaded" }, { status: 400 });
            }

            if (file.size > 5 * 1024 * 1024) {
                return Response.json(
                    { error: "File too large (max 5MB)" },
                    { status: 400 }
                );
            }

            fileName = file.name || fileName;
            buffer = Buffer.from(await file.arrayBuffer());
        } else if (contentType.includes("application/json")) {
            const body = await req.json();
            const payload = body.file ?? body.data ?? body.pdfData;

            if (!payload) {
                return Response.json({ error: "No file uploaded" }, { status: 400 });
            }

            fileName = body.fileName || body.filename || fileName;

            if (typeof payload === "string") {
                const base64 = payload.startsWith("data:") ? payload.split(",").pop() : payload;
                buffer = Buffer.from(base64, "base64");
            } else if (Array.isArray(payload)) {
                buffer = Buffer.from(payload);
            } else {
                return Response.json(
                    { error: "Unsupported JSON upload format" },
                    { status: 400 }
                );
            }
        } else {
            const rawBytes = await req.arrayBuffer();

            if (!rawBytes.byteLength) {
                return Response.json({ error: "No file uploaded" }, { status: 400 });
            }

            fileName = req.headers.get("x-file-name") || fileName;
            buffer = Buffer.from(rawBytes);
        }

        if (buffer.length > 5 * 1024 * 1024) {
            return Response.json(
                { error: "File too large (max 5MB)" },
                { status: 400 }
            );
        }

        let parser;
        let text;

        try {
            parser = new PDFParse({ data: buffer });
            const data = await parser.getText();
            await parser.destroy();

            if (!data || !data.text) {
                throw new Error("Failed to extract text from PDF");
            }

            text = data.text;
        } catch (err) {
            if (parser) await parser.destroy();
            throw err;
        }

        const chunks = text
            .replace(/\s+/g, " ")
            .match(/.{1,1000}/g) || [];

        const doc = await Document.create({
            userId,
            filename: fileName,
            chunks,
        });

        await User.findByIdAndUpdate(userId, {
            $inc: { "stats.filesUploaded": 1 },
        });

        return Response.json({
            message: "File processed successfully",
            fileId: doc._id,
        });

    } catch (error) {
        console.error("UPLOAD ERROR:", error);

        return Response.json(
            {
                error: "Upload failed",
                details: error.message,
            },
            { status: 500 }
        );
    }
}