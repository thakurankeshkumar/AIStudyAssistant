"use client";

import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState(null);
  const [fileId, setFileId] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [status, setStatus] = useState("");

  const handleUpload = async () => {
    if (!file) {
      setStatus("Select a PDF first.");
      return;
    }

    setStatus("");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus(data.error || "Upload failed.");
        return;
      }

      setFileId(data.fileId);
      setStatus("File uploaded successfully.");
      setAnswer("");
    } catch (error) {
      setStatus(error.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleAsk = async () => {
    if (!question || !fileId) {
      setStatus("Upload a PDF before asking a question.");
      return;
    }

    setLoading(true);
    setStatus("");

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileId,
          question,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus(data.error || "Failed to get an answer.");
        return;
      }

      setAnswer(data.answer || "No answer returned.");
    } catch (error) {
      setStatus(error.message || "Failed to get an answer.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Even if the request fails, clear the client session path.
    } finally {
      window.location.assign("/");
    }
  };

  return (
    <main className="min-h-screen px-6 py-8 lg:px-10" style={{ color: "var(--foreground)" }}>
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-(--muted)">Authenticated workspace</p>
            <h1 className="mt-2 text-4xl font-semibold text-white md:text-5xl">AI Study Assistant</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-(--muted) md:text-base">
              Upload a PDF, extract the text, and ask grounded questions against the document.
            </p>
          </div>

          <div className="flex gap-3 text-sm">
            <Link
              href="/"
              className="rounded-full border border-white/12 bg-white/5 px-4 py-2 text-white/90 transition hover:border-white/25 hover:bg-white/10"
            >
              Landing
            </Link>
            <Link
              href="/login"
              className="rounded-full bg-[#f0b35e] px-4 py-2 font-medium text-slate-950 transition hover:bg-[#ffbf71]"
            >
              Account
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-full border border-rose-400/20 bg-rose-400/10 px-4 py-2 font-medium text-rose-100 transition hover:border-rose-300/40 hover:bg-rose-400/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </header>

        <section className="mt-10 grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="rounded-4xl border border-white/10 bg-(--surface-strong) p-6 shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur md:p-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-(--muted)">Upload</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Add a PDF document</h2>
              </div>
              {fileId ? (
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
                  Ready
                </span>
              ) : (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-(--muted)">
                  Waiting
                </span>
              )}
            </div>

            <div className="mt-6 space-y-4">
              <label className="block rounded-3xl border border-dashed border-white/12 bg-white/5 px-5 py-6">
                <span className="block text-sm font-medium text-white">Choose PDF</span>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(event) => setFile(event.target.files?.[0] || null)}
                  className="mt-3 block w-full text-sm text-(--muted) file:mr-4 file:rounded-full file:border-0 file:bg-[#f0b35e] file:px-4 file:py-2 file:font-semibold file:text-slate-950 hover:file:bg-[#ffbf71]"
                />
              </label>

              <button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full rounded-2xl bg-[#f0b35e] px-5 py-3.5 font-semibold text-slate-950 transition hover:bg-[#ffbf71] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploading ? "Uploading..." : "Upload PDF"}
              </button>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-(--muted)">
                <p className="font-medium text-white">Current file</p>
                <p className="mt-2 wrap-break-word">{file?.name || "No file selected"}</p>
                <p className="mt-3 wrap-break-word">{fileId ? `Document ID: ${fileId}` : "Upload to generate a document ID."}</p>
              </div>

              {status ? (
                <p className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                  {status}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-6">
            <div className="rounded-4xl border border-white/10 bg-(--surface-strong) p-6 shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur md:p-8">
              <div className="border-b border-white/10 pb-4">
                <p className="text-xs uppercase tracking-[0.35em] text-(--muted)">Ask</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Question the document</h2>
              </div>

              <div className="mt-6 space-y-4">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-white/90">Your question</span>
                  <input
                    type="text"
                    placeholder="Ask a question about the uploaded PDF..."
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-[#101624] px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-[#f0b35e]"
                  />
                </label>

                <button
                  onClick={handleAsk}
                  disabled={loading}
                  className="w-full rounded-2xl border border-white/12 bg-white/5 px-5 py-3.5 font-semibold text-white transition hover:border-white/25 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Thinking..." : "Ask question"}
                </button>
              </div>
            </div>

            <div className="rounded-4xl border border-white/10 bg-(--surface-strong) p-6 shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur md:p-8">
              <div className="border-b border-white/10 pb-4">
                <p className="text-xs uppercase tracking-[0.35em] text-(--muted)">Answer</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Assistant response</h2>
              </div>

              <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5 text-sm leading-7" style={{ color: "var(--foreground)" }}>
                {answer ? (
                  <p className="whitespace-pre-wrap">{answer}</p>
                ) : (
                  <p className="text-(--muted)">Your answer will appear here after you ask a question.</p>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}