"use client";

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

function formatDate(value) {
  if (!value) {
    return "Unknown";
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

function getWelcomeCopy(name) {
  const hour = new Date().getHours();
  const safeName = name || "there";

  if (hour >= 5 && hour < 10) {
    return {
      greeting: `Good morning, ${safeName}.`,
      message: "Start light, stay focused, and make this session count.",
    };
  }

  if (hour >= 10 && hour < 14) {
    return {
      greeting: `Good late morning, ${safeName}.`,
      message: "Perfect time to read, revise, and clear tricky concepts.",
    };
  }

  if (hour >= 14 && hour < 18) {
    return {
      greeting: `Good afternoon, ${safeName}.`,
      message: "Keep the momentum going and turn your notes into answers.",
    };
  }

  if (hour >= 18 && hour < 22) {
    return {
      greeting: `Good evening, ${safeName}.`,
      message: "A calm review session can still unlock big progress.",
    };
  }

  return {
    greeting: `Good night, ${safeName}.`,
    message: "Late hours are great for one focused question at a time.",
  };
}

export default function Home() {
  const fileInputRef = useRef(null);
  const selectedChatIdRef = useRef("");
  const loadHistoryRef = useRef(null);
  const [file, setFile] = useState(null);
  const [fileId, setFileId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [creatingChat, setCreatingChat] = useState(false);
  const [status, setStatus] = useState("");
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [selectedChatId, setSelectedChatId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingChatId, setDeletingChatId] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const [settingsData, setSettingsData] = useState(null);
  const [settingsSection, setSettingsSection] = useState("General");
  const [settingsDeletingChatId, setSettingsDeletingChatId] = useState("");
  const [settingsDeletingAccount, setSettingsDeletingAccount] = useState(false);
  const [settingsResettingStats, setSettingsResettingStats] = useState(false);
  const [settingsGeneralMessage, setSettingsGeneralMessage] = useState("");
  const [settingsGeneralError, setSettingsGeneralError] = useState("");
  const [settingsNameInput, setSettingsNameInput] = useState("");
  const [settingsOldPassword, setSettingsOldPassword] = useState("");
  const [settingsNewPassword, setSettingsNewPassword] = useState("");
  const [settingsConfirmPassword, setSettingsConfirmPassword] = useState("");
  const [settingsUpdatingAccount, setSettingsUpdatingAccount] = useState(false);
  const [settingsUpdateMessage, setSettingsUpdateMessage] = useState("");
  const [settingsUpdateError, setSettingsUpdateError] = useState("");
  const [settingsDialog, setSettingsDialog] = useState(null);

  const starterPrompts = [
    "Summarize this PDF in simple words",
    "Explain the key topics from the uploaded document",
    "Create short exam questions from this file",
    "Give me a quick revision plan from this PDF",
  ];

  const settingsSections = [
    "General",
    "Chats",
    "Account",
  ];

  const selectChat = useCallback((chatId) => {
    selectedChatIdRef.current = chatId;
    setSelectedChatId(chatId);
  }, []);

  const selectedChat = useMemo(
    () => history.find((chat) => chat._id === selectedChatId) || null,
    [history, selectedChatId]
  );

  const activeChatTitle = selectedChat?.title || "New chat";
  const showWelcomePanel = !selectedChat || (selectedChat.messages?.length || 0) === 0;
  const welcomeCopy = useMemo(() => getWelcomeCopy(displayName), [displayName]);

  const refreshSettingsData = useCallback(async () => {
    setSettingsLoading(true);

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
        setSettingsError(payload.error || "Failed to load settings.");
        return;
      }

      setSettingsData(payload);
      setSettingsNameInput(payload?.profile?.name || "");
      setSettingsError("");
    } catch (requestError) {
      setSettingsError(requestError.message || "Failed to load settings.");
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  const openSettings = useCallback(async () => {
    setSettingsSection("General");
    setSettingsGeneralMessage("");
    setSettingsGeneralError("");
    setShowSettings(true);
    await refreshSettingsData();
  }, [refreshSettingsData]);

  const closeSettingsDialog = useCallback(() => {
    setSettingsDialog(null);
  }, []);

  const openSettingsDialog = useCallback((config) => {
    setSettingsDialog(config);
  }, []);

  const runSettingsDialog = useCallback(async () => {
    if (!settingsDialog) {
      return;
    }

    const dialog = settingsDialog;
    closeSettingsDialog();
    if (dialog.mode === "rename") {
      try {
        const response = await fetch("/api/chat/title", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ chatId: dialog.chatId, title: dialog.value || "" }),
        });

        const data = await response.json();

        if (response.status === 401) {
          window.location.assign("/login");
          return;
        }

        if (!response.ok) {
          setStatus(data.error || "Failed to rename chat.");
          return;
        }

        setStatus("Chat renamed successfully.");
        await loadHistoryRef.current?.({ selectLatest: false });
      } catch (error) {
        setStatus(error.message || "Failed to rename chat.");
      }
      return;
    }

    const action = dialog.action;
    await action();
  }, [closeSettingsDialog, settingsDialog]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });

        if (response.status === 401) {
          window.location.assign("/login");
          return;
        }

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        setDisplayName(data.name || data.username || "");

        // Redirect to welcome page if first time user
        if (data.firstTime) {
          window.location.assign("/welcome");
          return;
        }
      } catch {
        // Keep fallback greeting if profile lookup fails.
      }
    };

    void loadProfile();
  }, []);

  const visibleHistory = useMemo(() => {
    if (!searchTerm.trim()) {
      return history;
    }

    const lowerCasedSearch = searchTerm.toLowerCase();

    return history.filter((chat) => {
      const title = (chat.title || previewMessage(chat.messages)).toLowerCase();
      const date = formatChatDate(chat.createdAt).toLowerCase();

      return title.includes(lowerCasedSearch) || date.includes(lowerCasedSearch);
    });
  }, [history, searchTerm]);

  const loadHistory = useCallback(
    async ({ selectLatest = false } = {}) => {
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

        const currentSelectedChatId = selectedChatIdRef.current;
        const nextSelectedChatId = selectLatest
          ? chats[0]?._id || ""
          : currentSelectedChatId && chats.some((chat) => chat._id === currentSelectedChatId)
            ? currentSelectedChatId
            : chats[0]?._id || "";

        selectChat(nextSelectedChatId);

        const nextSelectedChat = chats.find((chat) => chat._id === nextSelectedChatId) || null;
        setFileId(nextSelectedChat?.fileId ? String(nextSelectedChat.fileId) : "");

        return chats;
      } catch (error) {
        setStatus(error.message || "Failed to load chat history.");
        return [];
      } finally {
        setHistoryLoading(false);
      }
    },
      [selectChat]
  );

  useEffect(() => {
    loadHistoryRef.current = loadHistory;
  }, [loadHistory]);

  const handleSettingsDeleteChat = async (chatId) => {
    setSettingsDeletingChatId(chatId);

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
        await Promise.all([refreshSettingsData(), loadHistory({ selectLatest: false })]);
      }
    } finally {
      setSettingsDeletingChatId("");
    }
  };

  const handleSettingsDeleteAccount = async () => {
    setSettingsDeletingAccount(true);

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
      setSettingsDeletingAccount(false);
    }
  };

  const handleSettingsResetStats = async () => {
    setSettingsResettingStats(true);
    setSettingsGeneralError("");
    setSettingsGeneralMessage("");

    try {
      const response = await fetch("/api/account/reset-stats", {
        method: "POST",
        credentials: "include",
      });

      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }

      const payload = await response.json();

      if (!response.ok) {
        setSettingsGeneralError(payload.error || "Failed to reset stats.");
        return;
      }

      setSettingsGeneralMessage(payload.message || "Stats reset successfully.");
      await refreshSettingsData();
    } catch (requestError) {
      setSettingsGeneralError(requestError.message || "Failed to reset stats.");
    } finally {
      setSettingsResettingStats(false);
    }
  };

  const submitSettingsAccountUpdate = useCallback(async ({ name, oldPassword, newPassword }) => {
    const response = await fetch("/api/account/update", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        name,
        oldPassword,
        newPassword,
      }),
    });

    if (response.status === 401) {
      window.location.assign("/login");
      return;
    }

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "Failed to update account.");
    }

    if (payload?.profile?.name) {
      setDisplayName(payload.profile.name);
    }

    setSettingsOldPassword("");
    setSettingsNewPassword("");
    setSettingsConfirmPassword("");
    setSettingsUpdateMessage(payload.message || "Account updated successfully.");

    await refreshSettingsData();
  }, [refreshSettingsData]);

  const handleSettingsAccountUpdate = async (event) => {
    event.preventDefault();
    setSettingsUpdateError("");
    setSettingsUpdateMessage("");

    const trimmedName = settingsNameInput.trim();
    const wantsPasswordChange = Boolean(settingsOldPassword || settingsNewPassword || settingsConfirmPassword);

    if (!trimmedName && !wantsPasswordChange) {
      setSettingsUpdateError("Enter a name or password change details.");
      return;
    }

    if (wantsPasswordChange) {
      if (!settingsOldPassword || !settingsNewPassword || !settingsConfirmPassword) {
        setSettingsUpdateError("Fill old password, new password, and confirm password.");
        return;
      }

      if (settingsNewPassword !== settingsConfirmPassword) {
        setSettingsUpdateError("New password and confirm password do not match.");
        return;
      }
    }

    openSettingsDialog({
      mode: "confirm",
      title: "Update account?",
      description: wantsPasswordChange
        ? "This will update your name and password after you confirm it one more time."
        : `This will update your name to ${trimmedName}.`,
      confirmLabel: "Update account",
      variant: "warning",
      action: async () => {
        setSettingsUpdatingAccount(true);

        try {
          await submitSettingsAccountUpdate({
            name: trimmedName || undefined,
            oldPassword: wantsPasswordChange ? settingsOldPassword : undefined,
            newPassword: wantsPasswordChange ? settingsNewPassword : undefined,
          });
        } catch (requestError) {
          setSettingsUpdateError(requestError.message || "Failed to update account.");
        } finally {
          setSettingsUpdatingAccount(false);
        }
      },
    });
  };

  const createChat = useCallback(async () => {
    setCreatingChat(true);

    try {
      const response = await fetch("/api/chat/create", {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (response.status === 401) {
        window.location.assign("/login");
        return null;
      }

      if (!response.ok) {
        setStatus(data.error || "Failed to create a chat.");
        return null;
      }

      const chatId = data.chatId || "";
      selectChat(chatId);
      setAnswer("");
      setStatus("New chat created.");
      await loadHistory({ selectLatest: true });
      return chatId;
    } catch (error) {
      setStatus(error.message || "Failed to create a chat.");
      return null;
    } finally {
      setCreatingChat(false);
    }
  }, [loadHistory, selectChat]);

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

      const uploadedFileId = String(data.fileId || "");
      setFileId(uploadedFileId);

      let chatId = selectedChatId;

      if (!chatId) {
        chatId = await createChat();

        if (!chatId) {
          return;
        }
      }

      const chatResponse = await fetch("/api/chat/file", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          chatId,
          fileId: uploadedFileId,
        }),
      });

      const chatData = await chatResponse.json();

      if (chatResponse.status === 401) {
        window.location.assign("/login");
        return;
      }

      if (!chatResponse.ok) {
        setStatus(chatData.error || "File uploaded, but could not attach it to the chat.");
        return;
      }

      setStatus("File uploaded successfully. You can now ask a question.");
      setAnswer("");
      await loadHistory({ selectLatest: false });
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

    let chatId = selectedChatId;

    if (!chatId) {
      chatId = await createChat();

      if (!chatId) {
        return;
      }
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
          chatId,
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
      selectChat(chatId);

      const selectedChatInHistory = history.find((chat) => chat._id === chatId);
      if (selectedChatInHistory && selectedChatInHistory.title === "New Chat") {
        const titleFromQuestion = question.substring(0, 60);
        try {
          await fetch("/api/chat/title", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
              chatId,
              title: titleFromQuestion,
            }),
          });
        } catch (err) {
          console.error("Failed to update chat title:", err);
        }
      }

      await loadHistory({ selectLatest: false });
    } catch (error) {
      setStatus(error.message || "Failed to get an answer.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChat = async (chatId) => {
    try {
      const response = await fetch("/api/chat/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ chatId }),
      });

      const data = await response.json();

      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }

      if (!response.ok) {
        setStatus(data.error || "Failed to delete chat.");
        return;
      }

      if (selectedChatId === chatId) {
        selectChat("");
        setFileId("");
      }

      setDeletingChatId("");
      setStatus("Chat deleted successfully.");
      await loadHistory({ selectLatest: false });
    } catch (error) {
      setStatus(error.message || "Failed to delete chat.");
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

  const handleNewChat = async () => {
    setFile(null);
    setFileId("");
    setQuestion("");
    setAnswer("");
    setStatus("");
    selectChat("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    await createChat();
  };

  const handleSend = async (event) => {
    event.preventDefault();
    await handleAsk();
  };

  return (
    <main className="h-screen overflow-hidden bg-[#0b0f17] text-slate-100">
      <div className="flex h-full min-h-0 flex-col lg:flex-row">
        <aside className="flex min-h-0 flex-col border-b border-white/10 bg-[#0d121b] lg:h-full lg:w-[320px] lg:border-b-0 lg:border-r">
          <div className="flex min-h-0 flex-1 flex-col p-4">
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400">Study Assistant</p>
                <h1 className="mt-1 text-lg font-semibold text-white">Chats</h1>
              </div>
              <button
                type="button"
                onClick={handleNewChat}
                disabled={creatingChat}
                className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs font-medium text-white transition hover:border-amber-400/40 hover:bg-amber-400/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creatingChat ? "Creating..." : "New chat"}
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

            <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-2">
              {historyLoading ? (
                <div className="rounded-lg border border-white/5 bg-white/3 p-3 text-sm text-slate-500">
                  Loading chats...
                </div>
              ) : visibleHistory.length === 0 ? (
                <div className="rounded-lg border border-dashed border-white/10 bg-white/3 p-3 text-sm leading-6 text-slate-500">
                  No saved chats yet. Ask a question to create your first chat.
                </div>
              ) : (
                <div className="space-y-1">
                  {visibleHistory.map((chat) => {
                    const isSelected = chat._id === selectedChatId;
                    const title = chat.title || "New chat";

                    return (
                      <div
                        key={chat._id}
                        className={`group relative flex items-center gap-2 rounded-lg px-3 py-2 transition-all duration-200 ${
                          isSelected
                            ? "border border-amber-400/20 bg-amber-400/10"
                            : "border border-transparent hover:border-white/10 hover:bg-white/5"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            selectChat(chat._id);
                            setFileId(chat.fileId ? String(chat.fileId) : "");
                          }}
                          className="min-w-0 flex-1 truncate text-left text-sm leading-snug text-slate-200 hover:text-white"
                        >
                          {title}
                        </button>

                        <div className="hidden gap-1 group-hover:flex">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openSettingsDialog({
                                mode: "rename",
                                title: "Rename chat",
                                description: "Enter a new title for this chat.",
                                confirmLabel: "Rename",
                                variant: "warning",
                                chatId: chat._id,
                                value: title,
                              });
                            }}
                            className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white transition"
                            title="Rename chat"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingChatId(chat._id);
                            }}
                            className="rounded p-1 text-slate-400 hover:bg-rose-400/20 hover:text-rose-400 transition"
                            title="Delete chat"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>

                        {deletingChatId === chat._id && (
                          <div className="absolute left-0 right-0 top-0 bottom-0 flex items-center justify-center gap-2 rounded-lg bg-black/80 z-50">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteChat(chat._id);
                              }}
                              className="rounded px-2 py-1 text-xs font-medium bg-rose-500 text-white hover:bg-rose-600"
                            >
                              Delete
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingChatId("");
                              }}
                              className="rounded px-2 py-1 text-xs font-medium bg-slate-600 text-white hover:bg-slate-700"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <button
                type="button"
                onClick={() => void openSettings()}
                className="w-full rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/10"
              >
                Settings
              </button>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full rounded-full border border-rose-400/20 bg-rose-400/10 px-4 py-2 text-sm font-medium text-rose-100 transition hover:border-rose-300/40 hover:bg-rose-400/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loggingOut ? "Logging out..." : "Logout"}
              </button>
            </div>
          </div>
        </aside>

        <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#0b0f17]">
          <header className="border-b border-white/10 bg-[#0b0f17]/95 px-4 py-4 backdrop-blur lg:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500">ChatGPT-style workspace</p>
                <h2 className="mt-1 text-xl font-semibold text-white sm:text-2xl">{activeChatTitle}</h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-400">
                  {selectedChat
                    ? previewMessage(selectedChat.messages)
                    : "No chat selected yet. Start a new thread from the sidebar."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                  {history.length} chats saved
                </span>
                {selectedChat?.fileId ? (
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-400">
                    File remembered for this chat
                  </span>
                ) : null}
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

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 lg:px-8">
              <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
                {showWelcomePanel ? (
                  <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
                    <div className="max-w-3xl space-y-6">
                      <div className="space-y-3">
                        <p className="text-sm uppercase tracking-[0.4em] text-slate-500">Study Assistant</p>
                        <h3 className="text-3xl font-semibold text-white sm:text-4xl">
                          {welcomeCopy.greeting}
                        </h3>
                        <p className="mx-auto max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
                          {welcomeCopy.message}
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        {starterPrompts.map((prompt) => (
                          <button
                            key={prompt}
                            type="button"
                            onClick={() => setQuestion(prompt)}
                            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-left text-sm text-slate-200 transition hover:border-amber-400/30 hover:bg-amber-400/10 hover:text-white"
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : selectedChat.messages?.length > 0 ? (
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
                )}

                {status ? (
                  <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                    {status}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="shrink-0 border-t border-white/10 bg-[#0c111a]/95 px-4 py-4 backdrop-blur lg:px-8">
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
                    {uploading ? "Uploading..." : selectedChat?.fileId ? "Replace chat PDF" : fileId ? "Re-upload PDF" : "Upload PDF"}
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
                    disabled={loading || creatingChat}
                    className="flex h-14 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Thinking..." : creatingChat ? "Creating chat..." : "Send"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>
      </div>

      {showSettings ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-md">
          <div className="relative flex h-[min(86vh,760px)] w-full max-w-7xl overflow-hidden rounded-4xl border border-white/10 bg-[#0d121b]/95 shadow-[0_30px_90px_rgba(0,0,0,0.55)]">
            <button
              type="button"
              onClick={() => setShowSettings(false)}
              className="absolute right-4 top-4 z-10 rounded-full border border-white/10 bg-black/30 px-3 py-2 text-xs text-slate-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              Close
            </button>

            <aside className="flex w-65 shrink-0 flex-col border-r border-white/10 bg-[#0c1118] p-4">
              <div className="mb-4 pr-16">
                <p className="text-[10px] uppercase tracking-[0.38em] text-slate-500">Settings</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">Account</h3>
                <p className="mt-2 text-sm text-slate-400">Manage your chats, usage, and account controls.</p>
              </div>

              <nav className="space-y-1 overflow-y-auto pr-1">
                {settingsSections.map((section) => (
                  <button
                    key={section}
                    type="button"
                    onClick={() => setSettingsSection(section)}
                    className={`flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left text-sm transition ${
                      settingsSection === section
                        ? "bg-white/10 text-white"
                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span>{section}</span>
                    <span className="text-xs uppercase tracking-[0.28em] text-slate-500">Open</span>
                  </button>
                ))}
              </nav>

              <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Profile</p>
                <p className="mt-2 text-base font-medium text-white">{settingsData?.profile?.name || displayName || "User"}</p>
                <p className="mt-1 break-all text-sm leading-5 text-slate-400">@{settingsData?.profile?.username || "unknown"}</p>
                <p className="mt-2 text-xs text-slate-500">
                  Joined {formatDate(settingsData?.profile?.createdAt)}
                </p>
              </div>
            </aside>

            <section className="min-w-0 flex-1 overflow-hidden bg-[#0b0f17]">
              <div className="flex h-full min-h-0 flex-col">
                <header className="border-b border-white/10 px-6 py-5">
                  <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500">Control center</p>
                  <h4 className="mt-2 text-2xl font-semibold text-white">{settingsSection}</h4>
                  <p className="mt-2 text-sm text-slate-400">
                    Control your account from one floating panel while keeping the chat visible behind it.
                  </p>
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
                  {settingsLoading ? (
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-slate-400">
                      Loading account settings...
                    </div>
                  ) : settingsError ? (
                    <div className="rounded-3xl border border-rose-400/20 bg-rose-400/10 p-6 text-rose-100">
                      {settingsError}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {settingsSection === "General" ? (
                        <>
                          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            {[
                              { label: "Chats created", value: settingsData?.stats?.chatsCreated || 0 },
                              { label: "Chats deleted", value: settingsData?.stats?.chatsDeleted || 0 },
                              { label: "Files uploaded", value: settingsData?.stats?.filesUploaded || 0 },
                              { label: "Active chats", value: settingsData?.stats?.activeChats || 0 },
                            ].map((item) => (
                              <div key={item.label} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{item.label}</p>
                                <p className="mt-3 text-4xl font-semibold text-white">{item.value}</p>
                              </div>
                            ))}
                          </section>

                          <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Stats controls</p>
                                <h5 className="mt-2 text-xl font-semibold text-white">Reset usage stats</h5>
                                <p className="mt-2 text-sm text-slate-400">
                                  This resets chat/file counters to zero without deleting your chats or files.
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  openSettingsDialog({
                                    title: "Reset stats?",
                                    description:
                                      "This will set your usage counters back to zero. Your chats and uploaded files will stay intact.",
                                    confirmLabel: "Reset stats",
                                    variant: "warning",
                                    action: handleSettingsResetStats,
                                  })
                                }
                                disabled={settingsResettingStats}
                                className="rounded-full border border-amber-300/30 bg-amber-400/15 px-4 py-2.5 text-sm font-medium text-amber-50 transition hover:bg-amber-400/25 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {settingsResettingStats ? "Resetting..." : "Reset stats"}
                              </button>
                            </div>

                            {settingsGeneralError ? (
                              <p className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                                {settingsGeneralError}
                              </p>
                            ) : null}

                            {settingsGeneralMessage ? (
                              <p className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                                {settingsGeneralMessage}
                              </p>
                            ) : null}
                          </section>

                          <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Overview</p>
                                <h5 className="mt-2 text-xl font-semibold text-white">Your account summary</h5>
                              </div>
                              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-slate-400">
                                Created {formatDate(settingsData?.profile?.createdAt)}
                              </span>
                            </div>

                            <div className="mt-5 grid gap-3 md:grid-cols-2">
                              <div className="rounded-2xl border border-white/10 bg-[#0b0f17] p-4">
                                <p className="text-sm text-slate-400">Name</p>
                                <p className="mt-1 text-base text-white">{settingsData?.profile?.name || displayName || "User"}</p>
                              </div>
                              <div className="rounded-2xl border border-white/10 bg-[#0b0f17] p-4">
                                <p className="text-sm text-slate-400">Username</p>
                                <p className="mt-1 text-base text-white">{settingsData?.profile?.username || "unknown"}</p>
                              </div>
                            </div>
                          </section>
                        </>
                      ) : null}

                      {settingsSection === "Chats" ? (
                        <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Chats</p>
                              <h5 className="mt-2 text-xl font-semibold text-white">Manage stored chat history</h5>
                            </div>
                            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-slate-400">
                              {settingsData?.chats?.length || 0} chats
                            </span>
                          </div>

                          <div className="mt-4 space-y-2">
                            {(settingsData?.chats || []).length === 0 ? (
                              <div className="rounded-2xl border border-dashed border-white/10 bg-[#0b0f17] p-5 text-sm text-slate-400">
                                No chats saved yet.
                              </div>
                            ) : (
                              settingsData.chats.map((chat) => (
                                <div
                                  key={chat._id}
                                  className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0b0f17] px-4 py-3"
                                >
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-white">{chat.title || "New chat"}</p>
                                    <p className="text-xs text-slate-500">Updated {formatDate(chat.updatedAt)}</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openSettingsDialog({
                                        title: "Delete chat?",
                                        description:
                                          "This removes the selected chat and will also delete its attached document if no other chat is using it.",
                                        confirmLabel: "Delete chat",
                                        variant: "danger",
                                        action: () => handleSettingsDeleteChat(chat._id),
                                      })
                                    }
                                    disabled={settingsDeletingChatId === chat._id}
                                    className="rounded-full border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-xs font-medium text-rose-100 transition hover:border-rose-300/40 hover:bg-rose-400/15 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {settingsDeletingChatId === chat._id ? "Deleting..." : "Delete"}
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        </section>
                      ) : null}

                      {settingsSection === "Account" ? (
                        <div className="space-y-6">
                          <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
                            <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Profile settings</p>
                            <h5 className="mt-2 text-xl font-semibold text-white">Change name and password</h5>
                            <p className="mt-2 text-sm text-slate-400">
                              To change password, enter your current password first.
                            </p>

                            <form className="mt-5 space-y-4" onSubmit={handleSettingsAccountUpdate}>
                              <label className="block space-y-2">
                                <span className="text-sm text-slate-300">Name</span>
                                <input
                                  type="text"
                                  value={settingsNameInput}
                                  onChange={(event) => setSettingsNameInput(event.target.value)}
                                  className="w-full rounded-2xl border border-white/10 bg-[#0b0f17] px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-amber-400/50"
                                  placeholder="Your name"
                                />
                              </label>

                              <div className="grid gap-3 md:grid-cols-2">
                                <label className="block space-y-2">
                                  <span className="text-sm text-slate-300">Old password</span>
                                  <input
                                    type="password"
                                    value={settingsOldPassword}
                                    onChange={(event) => setSettingsOldPassword(event.target.value)}
                                    className="w-full rounded-2xl border border-white/10 bg-[#0b0f17] px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-amber-400/50"
                                    placeholder="Current password"
                                  />
                                </label>

                                <label className="block space-y-2">
                                  <span className="text-sm text-slate-300">New password</span>
                                  <input
                                    type="password"
                                    value={settingsNewPassword}
                                    onChange={(event) => setSettingsNewPassword(event.target.value)}
                                    className="w-full rounded-2xl border border-white/10 bg-[#0b0f17] px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-amber-400/50"
                                    placeholder="New password"
                                  />
                                </label>
                              </div>

                              <label className="block space-y-2">
                                <span className="text-sm text-slate-300">Confirm new password</span>
                                <input
                                  type="password"
                                  value={settingsConfirmPassword}
                                  onChange={(event) => setSettingsConfirmPassword(event.target.value)}
                                  className="w-full rounded-2xl border border-white/10 bg-[#0b0f17] px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-amber-400/50"
                                  placeholder="Confirm new password"
                                />
                              </label>

                              {settingsUpdateError ? (
                                <p className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                                  {settingsUpdateError}
                                </p>
                              ) : null}

                              {settingsUpdateMessage ? (
                                <p className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                                  {settingsUpdateMessage}
                                </p>
                              ) : null}

                              <button
                                type="submit"
                                disabled={settingsUpdatingAccount}
                                className="rounded-full border border-amber-300/30 bg-amber-400/15 px-4 py-2.5 text-sm font-medium text-amber-50 transition hover:bg-amber-400/25 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {settingsUpdatingAccount ? "Updating..." : "Update account"}
                              </button>
                            </form>
                          </section>

                          <section className="rounded-3xl border border-rose-400/20 bg-rose-400/10 p-5">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="text-xs uppercase tracking-[0.32em] text-rose-200/70">Danger zone</p>
                                <h5 className="mt-2 text-xl font-semibold text-white">Delete your account</h5>
                                <p className="mt-2 text-sm text-rose-100/80">
                                  This removes your profile, all chats, and uploaded files permanently.
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  openSettingsDialog({
                                    title: "Delete account?",
                                    description:
                                      "This permanently deletes your account, chats, and uploaded files. This action cannot be undone.",
                                    confirmLabel: "Delete account",
                                    variant: "danger",
                                    action: handleSettingsDeleteAccount,
                                  })
                                }
                                disabled={settingsDeletingAccount}
                                className="rounded-full border border-rose-300/30 bg-rose-500/20 px-4 py-2.5 text-sm font-medium text-rose-50 transition hover:bg-rose-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {settingsDeletingAccount ? "Deleting..." : "Delete account"}
                              </button>
                            </div>
                          </section>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      ) : null}

      {settingsDialog ? (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-md">
          <div className="w-full max-w-md rounded-4xl border border-white/10 bg-[#0d121b]/95 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.55)]">
            <p className="text-xs uppercase tracking-[0.38em] text-slate-500">Confirmation</p>
            <h3 className="mt-3 text-2xl font-semibold text-white">{settingsDialog.title}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-400">{settingsDialog.description}</p>

            {settingsDialog.mode === "rename" ? (
              <label className="mt-5 block space-y-2">
                <span className="text-sm text-slate-300">Chat name</span>
                <input
                  autoFocus
                  type="text"
                  value={settingsDialog.value || ""}
                  onChange={(event) =>
                    setSettingsDialog((currentDialog) =>
                      currentDialog ? { ...currentDialog, value: event.target.value } : currentDialog
                    )
                  }
                  className="w-full rounded-2xl border border-white/10 bg-[#0b0f17] px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-amber-400/50"
                  placeholder="Enter chat name"
                />
              </label>
            ) : null}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeSettingsDialog}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-white/20 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void runSettingsDialog()}
                className={`rounded-full px-4 py-2 text-sm font-medium text-white transition ${
                  settingsDialog.variant === "danger"
                    ? "border border-rose-300/30 bg-rose-500/20 hover:bg-rose-500/30"
                    : "border border-amber-300/30 bg-amber-400/15 hover:bg-amber-400/25"
                }`}
              >
                {settingsDialog.confirmLabel || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
