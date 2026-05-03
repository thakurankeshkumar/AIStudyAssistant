"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const sections = ["General", "Chats", "Account"];

function formatDate(value) {
  if (!value) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("General");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [deletingChatId, setDeletingChatId] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  const chats = useMemo(() => data?.chats || [], [data]);
  const stats = data?.stats || {};
  const profile = data?.profile || {};

  useEffect(() => {
    const loadAccount = async () => {
      try {
        const response = await fetch("/api/account/stats", {
          credentials: "include",
        });

        if (response.status === 401) {
          window.location.assign("/login");
          return;
        }

        const payload = await response.json();

        if (!response.ok) {
          setError(payload.error || "Failed to load settings.");
          return;
        }

        setData(payload);
      } catch (requestError) {
        setError(requestError.message || "Failed to load settings.");
      } finally {
        setLoading(false);
      }
    };

    void loadAccount();
  }, []);

  const refreshData = async () => {
    try {
      const response = await fetch("/api/account/stats", {
        credentials: "include",
      });

      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }

      const payload = await response.json();

      if (response.ok) {
        setData(payload);
      }
    } catch {
      // Keep current UI if refresh fails.
    }
  };

  const handleDeleteChat = async (chatId) => {
    const confirmed = window.confirm("Delete this chat and its attached file if unused?");

    if (!confirmed) {
      return;
    }

    setDeletingChatId(chatId);

    try {
      const response = await fetch("/api/chat/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ chatId }),
      });

      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }

      if (response.ok) {
        await refreshData();
      }
    } finally {
      setDeletingChatId("");
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "This will permanently delete your account, all chats, and all uploaded files. Continue?"
    );

    if (!confirmed) {
      return;
    }

    setDeletingAccount(true);

    try {
      const response = await fetch("/api/account/delete", {
        method: "DELETE",
        credentials: "include",
      });

      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }

      window.location.assign("/");
    } catch {
      setDeletingAccount(false);
    }
  };

  return (
    <main className="hero-pattern min-h-screen px-3 py-3 text-slate-100 sm:px-4 sm:py-4 lg:px-6 lg:py-6">
      <div className="mx-auto flex min-h-[calc(100dvh-1.5rem)] w-full max-w-7xl flex-col overflow-hidden rounded-lg border border-white/10 bg-[#0d121b]/95 shadow-[0_24px_80px_rgba(0,0,0,0.45)] md:min-h-[calc(100dvh-2rem)] md:flex-row">
        <aside className="flex w-full shrink-0 flex-col border-b border-white/10 bg-[#0c1118] p-4 md:w-65 md:border-b-0 md:border-r">
          <Link href="/home" className="mb-5 text-sm text-slate-400 transition hover:text-white">
            ← Back to chat
          </Link>
          <div className="mb-4">
            <p className="text-[10px] uppercase tracking-[0.38em] text-slate-500">Settings</p>
            <h1 className="mt-2 text-2xl font-semibold text-white">Account</h1>
          </div>

          <nav className="flex gap-2 overflow-x-auto pb-1 md:block md:space-y-1 md:overflow-visible md:pb-0">
            {sections.map((section) => (
              <button
                key={section}
                type="button"
                onClick={() => setActiveSection(section)}
                className={`flex min-w-fit items-center justify-between gap-4 rounded-lg px-3 py-3 text-left text-sm transition md:w-full ${
                  activeSection === section
                    ? "bg-white/10 text-white"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span>{section}</span>
                <span className="text-xs uppercase tracking-[0.28em] text-slate-500">Open</span>
              </button>
            ))}
          </nav>

          <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-4 md:mt-6">
            <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Profile</p>
            <p className="mt-2 text-base font-medium text-white">{profile.name || "User"}</p>
            <p className="text-sm text-slate-400">@{profile.username || "unknown"}</p>
          </div>
        </aside>

        <section className="min-w-0 flex-1 overflow-hidden bg-[#0b0f17]">
          <div className="flex h-full min-h-0 flex-col">
            <header className="border-b border-white/10 px-4 py-4 sm:px-6 sm:py-5">
              <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500">Control center</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Manage your account</h2>
              <p className="mt-2 text-sm text-slate-400">
                See your usage, review chats, and keep full control over your study workspace.
              </p>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
              {loading ? (
                <div className="rounded-lg border border-white/10 bg-white/5 p-6 text-slate-400">
                  Loading account settings...
                </div>
              ) : error ? (
                <div className="rounded-lg border border-rose-400/20 bg-rose-400/10 p-6 text-rose-100">
                  {error}
                </div>
              ) : (
                <div className="space-y-6">
                  <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {[
                      { label: "Chats created", value: stats.chatsCreated || 0 },
                      { label: "Chats deleted", value: stats.chatsDeleted || 0 },
                      { label: "Files uploaded", value: stats.filesUploaded || 0 },
                      { label: "Active chats", value: stats.activeChats || 0 },
                    ].map((item) => (
                      <div key={item.label} className="rounded-lg border border-white/10 bg-white/5 p-5">
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{item.label}</p>
                        <p className="mt-3 text-4xl font-semibold text-white">{item.value}</p>
                      </div>
                    ))}
                  </section>

                  <section className="rounded-lg border border-white/10 bg-white/5 p-5">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Overview</p>
                        <h3 className="mt-2 text-xl font-semibold text-white">Your account summary</h3>
                      </div>
                      <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-slate-400">
                        Created {formatDate(profile.createdAt)}
                      </span>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                      <div className="rounded-lg border border-white/10 bg-[#0b0f17] p-4">
                        <p className="text-sm text-slate-400">Name</p>
                        <p className="mt-1 text-base text-white">{profile.name || "User"}</p>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-[#0b0f17] p-4">
                        <p className="text-sm text-slate-400">Username</p>
                        <p className="mt-1 text-base text-white">{profile.username || "unknown"}</p>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-lg border border-white/10 bg-white/5 p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Chats</p>
                        <h3 className="mt-2 text-xl font-semibold text-white">Manage stored chat history</h3>
                      </div>
                      <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-slate-400">
                        {chats.length} chats
                      </span>
                    </div>

                    <div className="mt-4 space-y-2">
                      {chats.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-white/10 bg-[#0b0f17] p-5 text-sm text-slate-400">
                          No chats saved yet.
                        </div>
                      ) : (
                        chats.map((chat) => (
                          <div
                            key={chat._id}
                            className="flex flex-col gap-3 rounded-lg border border-white/10 bg-[#0b0f17] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-white">{chat.title || "New chat"}</p>
                              <p className="text-xs text-slate-500">Updated {formatDate(chat.updatedAt)}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => void handleDeleteChat(chat._id)}
                              disabled={deletingChatId === chat._id}
                            className="w-full rounded-full border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-xs font-medium text-rose-100 transition hover:border-rose-300/40 hover:bg-rose-400/15 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                            >
                              {deletingChatId === chat._id ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </section>

                  <section className="rounded-lg border border-rose-400/20 bg-rose-400/10 p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.32em] text-rose-200/70">Danger zone</p>
                        <h3 className="mt-2 text-xl font-semibold text-white">Delete your account</h3>
                        <p className="mt-2 text-sm text-rose-100/80">
                          This removes your profile, all chats, and uploaded files permanently.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleDeleteAccount}
                        disabled={deletingAccount}
                        className="w-full rounded-full border border-rose-300/30 bg-rose-500/20 px-4 py-2.5 text-sm font-medium text-rose-50 transition hover:bg-rose-500/30 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                      >
                        {deletingAccount ? "Deleting..." : "Delete account"}
                      </button>
                    </div>
                  </section>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
