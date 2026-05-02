"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

function formatChatDate(value) {
  if (!value) {
    return "Just now";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function previewMessage(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return "No messages yet.";
  }

  const firstUserMessage = messages.find((message) => message.role === "user");

  if (!firstUserMessage?.content) {
    return "No messages yet.";
  }

  return firstUserMessage.content;
}

export default function Home() {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [fileId, setFileId] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [status, setStatus] = useState("");
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [selectedChatId, setSelectedChatId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const selectedChat = useMemo(
    () => history.find((chat) => chat._id === selectedChatId) || null,
    [history, selectedChatId]
  );

  const visibleHistory = useMemo(() => {
    if (!searchTerm.trim()) {
      return history;
    }

    const lowerCasedSearch = searchTerm.toLowerCase();

    return history.filter((chat) => {
      const title = previewMessage(chat.messages).toLowerCase();
      const date = formatChatDate(chat.createdAt).toLowerCase();

      return title.includes(lowerCasedSearch) || date.includes(lowerCasedSearch);
    });
  }, [history, searchTerm]);

  const loadHistory = useCallback(async ({ selectLatest = false } = {}) => {
    setHistoryLoading(true);

    try {
      const response = await fetch("/api/chat/history", {
        credentials: "include",
      });

      if (response.status === 401) {
        window.location.assign("/login");
        return [];
      }

      const data = await response.json();

      if (!response.ok) {
        setStatus(data.error || "Failed to load chat history.");
        return [];
      }

      const chats = Array.isArray(data) ? data : [];
      setHistory(chats);

      if (selectLatest || !selectedChatId) {
        setSelectedChatId(chats[0]?._id || "");
      } else if (selectedChatId && !chats.some((chat) => chat._id === selectedChatId)) {
        setSelectedChatId(chats[0]?._id || "");
      }

      return chats;
    } catch (error) {
      setStatus(error.message || "Failed to load chat history.");
      return [];
    } finally {
      setHistoryLoading(false);
    }
  }, [selectedChatId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadHistory({ selectLatest: true });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadHistory]);

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

      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }

      if (!response.ok) {
        setStatus(data.error || "Upload failed.");
        return;
      }

      setFileId(data.fileId);
      setStatus("File uploaded successfully. You can now ask a question.");
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
        credentials: "include",
        body: JSON.stringify({
          fileId,
          question,
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }

      if (!response.ok) {
        setStatus(data.error || "Failed to get an answer.");
        return;
      }

      setAnswer(data.answer || "No answer returned.");
      setQuestion("");
      await loadHistory({ selectLatest: true });
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
      // If logout fails, still move away from the app shell.
    } finally {
      window.location.assign("/");
    }
  };

  const handleNewChat = () => {
    setFile(null);
    setFileId("");
    setQuestion("");
    setAnswer("");
    setStatus("");
    setSelectedChatId("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSend = async (event) => {
    event.preventDefault();
    await handleAsk();
  };

  return (
    <main className="min-h-screen bg-[#0b0f17] text-slate-100">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="border-b border-white/10 bg-[#0d121b] lg:min-h-screen lg:w-[320px] lg:border-b-0 lg:border-r">
          <div className="flex h-full flex-col p-4">
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400">Study Assistant</p>
                <h1 className="mt-1 text-lg font-semibold text-white">Chats</h1>
              </div>
              <button
                type="button"
                onClick={handleNewChat}
                className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs font-medium text-white transition hover:border-amber-400/40 hover:bg-amber-400/10"
              >
                New chat
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <span className="text-slate-500">Search</span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search chats"
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                />
              </label>
            </div>

            <div className="mt-4 min-h-0 flex-1 overflow-auto pr-1">
              {historyLoading ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
                  Loading chats...
                </div>
              ) : visibleHistory.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-400">
                  No saved chats yet. Ask a question to create your first chat.
                </div>
              ) : (
                <div className="space-y-2">
                  {visibleHistory.map((chat) => {
                    const isSelected = chat._id === selectedChatId;

                    return (
                      <button
                        key={chat._id}
                        type="button"
                        onClick={() => setSelectedChatId(chat._id)}
                        className={`w-full rounded-2xl border px-3 py-3 text-left transition ${
                          isSelected
                            ? "border-amber-400/40 bg-amber-400/10"
                            : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                        }`}
                      >
                        <p className="line-clamp-2 text-sm font-medium text-white">{previewMessage(chat.messages)}</p>
                        <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-slate-400">
                          <span>{formatChatDate(chat.createdAt)}</span>
                          <span className="rounded-full border border-white/10 bg-black/20 px-2 py-1 uppercase tracking-[0.22em]">
                            Chat
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full rounded-full border border-rose-400/20 bg-rose-400/10 px-4 py-2 text-sm font-medium text-rose-100 transition hover:border-rose-300/40 hover:bg-rose-400/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loggingOut ? "Logging out..." : "Logout"}
              </button>
              <Link
                href="/"
                className="block w-full rounded-full border border-white/10 bg-black/20 px-4 py-2 text-center text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/10"
              >
                Landing
              </Link>
            </div>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col bg-[#0b0f17]">
          <header className="border-b border-white/10 bg-[#0b0f17]/95 px-4 py-4 backdrop-blur lg:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500">ChatGPT-style workspace</p>
                <h2 className="mt-1 text-xl font-semibold text-white sm:text-2xl">
                  {selectedChat ? previewMessage(selectedChat.messages) : "New chat"}
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                  {history.length} chats saved
                </span>
                {fileId ? (
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-emerald-300">
                    PDF ready
                  </span>
                ) : (
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-400">
                    Upload required
                  </span>
                )}
              </div>
            </div>
          </header>

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-auto px-4 py-6 lg:px-8">
              <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
                {selectedChat ? (
                  selectedChat.messages?.length > 0 ? (
                    selectedChat.messages.map((message, index) => (
                      <div
                        key={`${selectedChat._id}-${index}`}
                        className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[90%] rounded-3xl border px-4 py-3 shadow-lg sm:max-w-[80%] ${
                            message.role === "user"
                              ? "border-amber-400/20 bg-amber-400/10 text-amber-50"
                              : "border-white/10 bg-[#111827] text-slate-100"
                          }`}
                        >
                          <p className="mb-2 text-[10px] uppercase tracking-[0.32em] text-slate-400">
                            {message.role === "user" ? "You" : "Assistant"}
                          </p>
                          <p className="whitespace-pre-wrap text-sm leading-7 sm:text-[15px]">{message.content}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex min-h-70 items-center justify-center rounded-4xl border border-dashed border-white/10 bg-white/5 px-6 py-12 text-center text-slate-400">
                      This chat has no messages yet.
                    </div>
                  )
                ) : (
                  <div className="flex min-h-105 items-center justify-center rounded-4xl border border-dashed border-white/10 bg-white/5 px-6 py-12 text-center">
                    <div className="max-w-lg">
                      <p className="text-[11px] uppercase tracking-[0.4em] text-slate-500">Ready to start</p>
                      <h3 className="mt-3 text-3xl font-semibold text-white">Upload a PDF and ask your first question</h3>
                      <p className="mt-4 text-sm leading-7 text-slate-400 sm:text-base">
                        Your chat history appears on the left. When you ask a question, the assistant saves a chat record
                        only for your account.
                      </p>
                    </div>
                  </div>
                )}

                {status ? (
                  <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                    {status}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="border-t border-white/10 bg-[#0c111a]/95 px-4 py-4 backdrop-blur lg:px-8">
              <form
                onSubmit={handleSend}
                className="mx-auto flex w-full max-w-4xl flex-col gap-3 rounded-[1.75rem] border border-white/10 bg-[#101624] p-3 shadow-2xl shadow-black/30"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/10"
                  >
                    Attach PDF
                  </button>
                  <button
                    type="button"
                    onClick={handleUpload}
                    disabled={uploading || !file}
                    className="rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-sm font-medium text-amber-100 transition hover:border-amber-300/40 hover:bg-amber-400/15 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {uploading ? "Uploading..." : fileId ? "Re-upload PDF" : "Upload PDF"}
                  </button>
                  <span className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-400">
                    {file?.name || "No file attached"}
                  </span>
                  <span className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-400">
                    {fileId ? `File ID: ${fileId.slice(0, 10)}...` : "Waiting for upload"}
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={(event) => setFile(event.target.files?.[0] || null)}
                    className="hidden"
                  />
                </div>

                <div className="flex items-end gap-3">
                  <textarea
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        if (!loading) {
                          void handleSend(event);
                        }
                      }
                    }}
                    placeholder="Ask anything about the uploaded PDF..."
                    rows={2}
                    className="max-h-40 min-h-14 flex-1 resize-none rounded-3xl border border-white/10 bg-[#0b0f17] px-4 py-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-amber-400 sm:text-[15px]"
                  />

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex h-14 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Thinking..." : "Send"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
