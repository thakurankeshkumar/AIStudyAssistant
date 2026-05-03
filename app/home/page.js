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
  const [isDraftChat, setIsDraftChat] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const statusTimerRef = useRef(null);
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
  const [showWelcomeOverlay, setShowWelcomeOverlay] = useState(false);
  const [welcomeSaving, setWelcomeSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const clearPendingFileSelection = useCallback(() => {
    setFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const selectChat = useCallback((chatId) => {
    clearPendingFileSelection();
    selectedChatIdRef.current = chatId;
    setSelectedChatId(chatId);
    setIsDraftChat(chatId === "");

    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [clearPendingFileSelection]);

  const dismissStatus = useCallback(() => {
    if (statusTimerRef.current) {
      clearTimeout(statusTimerRef.current);
      statusTimerRef.current = null;
    }
    setStatus("");
  }, []);

  const showStatus = useCallback((message, autoDismiss = true) => {
    // always clear existing
    if (statusTimerRef.current) {
      clearTimeout(statusTimerRef.current);
      statusTimerRef.current = null;
    }

    setStatus(message);

    if (autoDismiss && message) {
      statusTimerRef.current = setTimeout(() => {
        setStatus("");
        statusTimerRef.current = null;
      }, 2000);
    }
  }, []);

  const selectedChat = useMemo(
    () => history.find((chat) => chat._id === selectedChatId) || null,
    [history, selectedChatId]
  );

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
          showStatus(data.error || "Failed to rename chat.");
          return;
        }

        showStatus("Chat renamed successfully.");
        await loadHistoryRef.current?.({ selectLatest: false });
      } catch (error) {
        showStatus(error.message || "Failed to rename chat.");
      }
      return;
    }

    const action = dialog.action;
    await action();
  }, [closeSettingsDialog, settingsDialog, showStatus]);

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

        if (data.firstTime) {
          setShowWelcomeOverlay(true);
        } else {
          setShowWelcomeOverlay(false);
        }
      } catch {
        // Keep fallback greeting if profile lookup fails.
      }
    };

    void loadProfile();
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");

    const syncSidebar = () => {
      setSidebarOpen(mediaQuery.matches);
    };

    syncSidebar();
    mediaQuery.addEventListener("change", syncSidebar);

    return () => mediaQuery.removeEventListener("change", syncSidebar);
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
          showStatus(data.error || "Failed to load chat history.");
          return [];
        }

        const chats = Array.isArray(data) ? data : [];
        setHistory(chats);

        const currentSelectedChatId = selectedChatIdRef.current;
        const nextSelectedChatId = selectLatest
          ? chats[0]?._id || ""
          : currentSelectedChatId && chats.some((chat) => chat._id === currentSelectedChatId)
            ? currentSelectedChatId
            : isDraftChat
              ? ""
              : chats[0]?._id || "";

        selectChat(nextSelectedChatId);

        const nextSelectedChat = chats.find((chat) => chat._id === nextSelectedChatId) || null;
        setFileId(nextSelectedChat?.fileId ? String(nextSelectedChat.fileId) : "");

        return chats;
      } catch (error) {
        showStatus(error.message || "Failed to load chat history.");
        return [];
      } finally {
        setHistoryLoading(false);
      }
    },
      [isDraftChat, selectChat, showStatus]
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
        showStatus(data.error || "Failed to create a chat.");
        return null;
      }

      const chatId = data.chatId || "";
      setIsDraftChat(false);
      selectChat(chatId);
      setAnswer("");
      showStatus("New chat created.");
      await loadHistory({ selectLatest: false });
      return chatId;
    } catch (error) {
      showStatus(error.message || "Failed to create a chat.");
      return null;
    } finally {
      setCreatingChat(false);
    }
  }, [loadHistory, selectChat, showStatus]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadHistory({ selectLatest: true });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadHistory]);

  const handleUpload = async () => {
    if (!file) {
      showStatus("Select a PDF first.");
      return;
    }

    dismissStatus();
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await response.json();

      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }

      if (!response.ok) {
        showStatus(data.error || "Upload failed.");
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
        showStatus(chatData.error || "File uploaded, but could not attach it to the chat.");
        return;
      }

      showStatus("File uploaded successfully. You can now ask a question.");
      clearPendingFileSelection();
      setAnswer("");
      await loadHistory({ selectLatest: false });
    } catch (error) {
      showStatus(error.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleAsk = async () => {
    if (!question) {
      showStatus("Enter a question first.");
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
    dismissStatus();

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          fileId: fileId || undefined,
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
        showStatus(data.error || "Failed to get an answer.");
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
      showStatus(error.message || "Failed to get an answer.");
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
        showStatus(data.error || "Failed to delete chat.");
        return;
      }

      if (selectedChatId === chatId) {
        selectChat("");
        setFileId("");
      }

      setDeletingChatId("");
      showStatus("Chat deleted successfully.");
      await loadHistory({ selectLatest: false });
    } catch (error) {
      showStatus(error.message || "Failed to delete chat.");
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

  const handleWelcomeStart = async () => {
    setWelcomeSaving(true);

    try {
      await fetch("/api/auth/welcome", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Error acknowledging welcome:", error);
    } finally {
      setWelcomeSaving(false);
      setShowWelcomeOverlay(false);
    }
  };

  const handleNewChat = async () => {
    dismissStatus();

    const chatId = await createChat();

    if (!chatId) {
      return;
    }

    setFileId("");
    setQuestion("");
    setAnswer("");
  };

  const handleSend = async (event) => {
    event.preventDefault();
    await handleAsk();
  };

  const showUploadAction = Boolean(file);

  return (
    <main className="h-[100dvh] overflow-hidden bg-[#080c14] text-slate-100">
      <div className="relative flex h-full min-h-0 flex-col lg:flex-row">
        {sidebarOpen ? (
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-30 bg-black/55 backdrop-blur-sm lg:hidden"
            aria-label="Close sidebar overlay"
          />
        ) : null}

        {!sidebarOpen ? (
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="absolute left-3 top-3 z-30 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-[#0b111d]/95 text-slate-100 shadow-lg shadow-black/30 transition hover:bg-[#111827] lg:fixed"
            aria-label="Open sidebar"
            title="Open sidebar"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h10M4 18h16" />
            </svg>
          </button>
        ) : null}

        <aside
          className={`fixed inset-y-0 left-0 z-40 min-h-0 border-r border-white/10 bg-[#0b111d] shadow-2xl shadow-black/40 transition-[width,opacity,transform] duration-200 lg:static lg:h-full lg:shadow-none ${
            sidebarOpen
              ? "flex w-[min(86vw,320px)] flex-col opacity-100 lg:w-[260px]"
              : "pointer-events-none flex w-[min(86vw,320px)] -translate-x-full flex-col opacity-0 lg:pointer-events-auto lg:w-0 lg:-translate-x-3 lg:overflow-hidden"
          }`}
        >
          <div className="flex min-h-0 flex-1 flex-col px-2 py-3">
            <div className="flex items-center justify-between px-2 pb-3">
              <div className="flex items-center gap-2 rounded-xl px-1 py-1">
                <span className="grid h-9 w-9 place-items-center rounded-xl border border-amber-200/15 bg-linear-to-br from-amber-300/18 to-white/[0.04] text-sm font-black text-amber-100 shadow-[0_10px_30px_rgba(240,179,94,0.08)]">
                  SA
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-white">Study desk</span>
                  <span className="block text-[11px] text-slate-500">Focused chat</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-xl text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
                aria-label="Hide sidebar"
                title="Hide sidebar"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 5h14v14H5zM9 5v14" />
                </svg>
              </button>
            </div>

            <div className="space-y-1 rounded-2xl border border-white/[0.06] bg-[#101624] p-1">
              <button
                type="button"
                onClick={handleNewChat}
                disabled={creatingChat}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-100 transition hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 5h7M12 19h7M5 12h14M5 5h3v3H5zM5 16h3v3H5z" />
                </svg>
                <span>{creatingChat ? "Creating..." : "New chat"}</span>
              </button>

              <label className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-100 transition focus-within:bg-white/[0.07] hover:bg-white/[0.07]">
                <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
                </svg>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search chats"
                  className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-300"
                />
                {searchTerm.trim() ? (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="rounded p-0.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
                    aria-label="Clear search"
                    title="Clear search"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                ) : null}
              </label>
            </div>

            <div className="mx-1 mt-3 rounded-2xl border border-amber-200/10 bg-amber-200/[0.045] px-3 py-2.5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-amber-100">Study mode</span>
                <span className="rounded-full bg-amber-200/10 px-2 py-0.5 text-[11px] text-amber-100">
                  {fileId || selectedChat?.fileId ? "PDF" : "General"}
                </span>
              </div>
              <p className="mt-1 truncate text-[11px] text-slate-500">
                {historyLoading ? "Syncing chats" : `${history.length} saved conversations`}
              </p>
            </div>

            <div className="mt-5 min-h-0 flex-1 overflow-y-auto px-1 pr-2">
              <div className="flex items-center justify-between px-3 pb-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Recents</p>
                <span className="text-[11px] text-slate-600">{visibleHistory.length}</span>
              </div>
              {historyLoading ? (
                <div className="rounded-lg px-3 py-2 text-sm text-slate-400">
                  Loading chats...
                </div>
              ) : visibleHistory.length === 0 ? (
                <div className="rounded-lg px-3 py-2 text-sm leading-6 text-slate-400">
                  No chats yet.
                </div>
              ) : (
                <div className="space-y-0.5">
                  {visibleHistory.map((chat) => {
                    const isSelected = chat._id === selectedChatId;
                    const title = chat.title || "New chat";

                    return (
                      <div
                        key={chat._id}
                        className={`group relative flex items-center gap-1 rounded-xl transition ${
                          isSelected
                            ? "bg-amber-300/10 text-white shadow-[inset_3px_0_0_rgba(240,179,94,0.65)]"
                            : "text-slate-300 hover:bg-white/[0.06] hover:text-slate-50"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            selectChat(chat._id);
                            setFileId(chat.fileId ? String(chat.fileId) : "");
                          }}
                          className="min-w-0 flex-1 truncate px-3 py-2.5 text-left text-sm"
                          title={title}
                        >
                          {title}
                        </button>

                        <div className="mr-1 hidden shrink-0 items-center gap-0.5 group-hover:flex">
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
                            className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white transition"
                            title="Rename chat"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingChatId(chat._id);
                            }}
                            className="rounded-lg p-1 text-slate-400 hover:bg-rose-400/20 hover:text-rose-300 transition"
                            title="Delete chat"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>

                        {deletingChatId === chat._id && (
                          <div className="absolute inset-0 z-20 flex items-center justify-center gap-2 rounded-lg bg-[#0b111d]/95">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteChat(chat._id);
                              }}
                              className="rounded-lg bg-rose-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-rose-600"
                            >
                              Delete
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingChatId("");
                              }}
                              className="rounded-lg bg-white/10 px-2.5 py-1 text-xs font-medium text-white hover:bg-white/15"
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

            <div className="mt-3 border-t border-white/[0.08] px-1 pt-2">
              <button
                type="button"
                onClick={() => void openSettings()}
                className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-white/[0.07]"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-linear-to-br from-amber-300/20 to-white/[0.05] text-xs font-semibold text-amber-100">
                  {(displayName || "U").slice(0, 1).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-white">{displayName || "User"}</span>
                  <span className="block truncate text-xs text-slate-400">Settings</span>
                </span>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="mt-1 flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left text-sm text-slate-400 transition hover:bg-white/[0.07] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.75 9V5.75A1.75 1.75 0 0014 4H6.75A1.75 1.75 0 005 5.75v12.5C5 19.216 5.784 20 6.75 20H14a1.75 1.75 0 001.75-1.75V15M12 12h8m0 0l-3-3m3 3l-3 3" />
                </svg>
                {loggingOut ? "Logging out..." : "Log out"}
              </button>
            </div>
          </div>
        </aside>

        <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#080d18]">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <header className="flex min-h-12 shrink-0 items-center justify-between gap-3 px-4 py-2 pl-16 sm:px-6 lg:justify-end lg:pl-6">
              <p className="truncate text-sm font-medium text-slate-300 lg:hidden">
                {selectedChat?.title || "Study desk"}
              </p>
              <div className="flex shrink-0 items-center gap-2">
                <span className="rounded-full border border-white/10 bg-[#101624] px-3 py-1 text-xs text-slate-300">
                  {fileId || selectedChat?.fileId ? "PDF attached" : "General"}
                </span>
                <span className="hidden rounded-full border border-white/10 bg-[#101624] px-3 py-1 text-xs text-slate-300 sm:inline-flex">
                  {selectedChat?.messages?.length || 0} messages
                </span>
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto bg-[radial-gradient(circle_at_50%_0%,rgba(240,179,94,0.055),transparent_34%),linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[length:auto,44px_44px] px-4 py-6 sm:px-6">
              <div className="mx-auto flex w-full max-w-3xl flex-col">
                {showWelcomePanel ? (
                  <div className="flex min-h-[calc(100dvh-235px)] flex-col items-center justify-center text-center">
                    <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl border border-amber-300/20 bg-amber-300/10 text-sm font-black text-amber-100 shadow-[0_12px_40px_rgba(240,179,94,0.08)]">
                      SA
                    </div>
                    <h2 className="text-2xl font-medium text-slate-50 sm:text-3xl">
                      What should we study today?
                    </h2>
                    <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
                      {welcomeCopy.message}
                    </p>
                    <div className="mt-7 grid w-full max-w-2xl gap-2 sm:grid-cols-2">
                        {starterPrompts.map((prompt, index) => (
                          <button
                            key={prompt}
                            type="button"
                            onClick={() => setQuestion(prompt)}
                            className="group flex min-h-14 items-center gap-3 rounded-2xl border border-white/10 bg-[#101624]/90 px-4 py-3 text-left text-sm leading-6 text-slate-200 transition hover:border-amber-200/20 hover:bg-[#151c2b]"
                          >
                            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/[0.06] text-xs text-amber-100 group-hover:bg-amber-300/12">
                              0{index + 1}
                            </span>
                            <span>
                              {prompt.replace(" from this PDF", "").replace(" from this file", "")}
                            </span>
                          </button>
                        ))}
                    </div>
                  </div>
                ) : selectedChat?.messages?.length > 0 ? (
                  <div className="space-y-7 pb-6 pt-4">
                    {selectedChat.messages.map((message, index) => (
                      <div
                        key={`${selectedChat._id}-${index}`}
                        className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div className={message.role === "user" ? "max-w-[92%] sm:max-w-[70%]" : "w-full"}>
                          <p
                            className={`whitespace-pre-wrap wrap-break-word text-left text-[15px] leading-7 ${
                              message.role === "user"
                                ? "rounded-[1.35rem] rounded-br-md bg-amber-300/12 px-5 py-3 text-amber-50 shadow-[inset_0_0_0_1px_rgba(240,179,94,0.12)]"
                                : "border-l border-amber-200/20 pl-4 text-slate-100"
                            }`}
                          >
                            {message.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex min-h-64 items-center justify-center px-6 py-12 text-center">
                    <p className="text-sm text-slate-400">This chat is empty. Ask a question to get started.</p>
                  </div>
                )}

                {status && (
                  <div className="rounded-lg border border-amber-400/30 bg-linear-to-r from-amber-400/20 to-amber-400/10 px-4 py-3 text-sm text-amber-100 flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-400/30">
                      <span className="h-2 w-2 rounded-full bg-amber-400"></span>
                    </span>
                    <p className="flex-1">{status}</p>
                    <button
                      type="button"
                      onClick={() => dismissStatus()}
                      className="rounded-full p-1 text-amber-200/80 transition hover:bg-amber-300/20 hover:text-amber-50"
                      aria-label="Dismiss notification"
                      title="Dismiss"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="shrink-0 bg-[#080d18] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 sm:px-6 sm:pb-4">
              <form
                onSubmit={handleSend}
                className="mx-auto flex w-full max-w-3xl flex-col gap-2"
              >
                {(file || selectedChat?.fileId) ? (
                  <div className="flex flex-wrap items-center gap-2 px-1">
                    <span className="min-w-0 truncate rounded-full border border-white/10 bg-[#101624] px-3 py-1.5 text-xs text-slate-300">
                      {file ? file.name : "Chat PDF attached"}
                    </span>
                    {showUploadAction ? (
                      <button
                        type="button"
                        onClick={handleUpload}
                        disabled={uploading}
                        className="rounded-full border border-white/10 bg-[#101624] px-3 py-1.5 text-xs font-medium text-slate-100 transition hover:bg-[#151c2b] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {uploading ? "Uploading..." : "Upload PDF"}
                      </button>
                    ) : null}
                    {file ? (
                      <button
                        type="button"
                        onClick={clearPendingFileSelection}
                        className="rounded-full border border-white/10 bg-transparent px-3 py-1.5 text-xs text-slate-300 transition hover:bg-[#101624]"
                      >
                        Clear
                      </button>
                    ) : null}
                  </div>
                ) : null}

                <div className="flex items-end gap-1.5 rounded-3xl bg-[#101624] px-2.5 py-2 shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_18px_50px_rgba(0,0,0,0.22)] transition focus-within:shadow-[0_0_0_1px_rgba(240,179,94,0.3),0_18px_50px_rgba(0,0,0,0.22)] sm:gap-2 sm:px-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading || creatingChat || uploading}
                    className="mb-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                    title={file ? "Change PDF" : "Attach PDF"}
                    aria-label={file ? "Change PDF" : "Attach PDF"}
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 5v14M5 12h14" />
                    </svg>
                  </button>

                  <div className="min-w-0 flex-1 px-1">
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
                      placeholder={fileId || selectedChat?.fileId ? "Ask anything about the attached PDF" : "Ask anything"}
                      rows={1}
                      className="max-h-36 min-h-9 w-full resize-none bg-transparent pb-1 pt-2 text-left text-[15px] leading-6 text-white outline-none placeholder:text-slate-400"
                    />
                  </div>

                  {showUploadAction ? (
                    <button
                      type="button"
                      onClick={handleUpload}
                      disabled={uploading}
                      className="mb-0.5 hidden h-9 items-center rounded-full bg-amber-300/10 px-3 text-xs font-medium text-amber-50 transition hover:bg-amber-300/15 disabled:cursor-not-allowed disabled:opacity-60 sm:inline-flex"
                    >
                      {uploading ? "Uploading" : "Upload"}
                    </button>
                  ) : null}

                  <button
                    type="submit"
                    disabled={loading || creatingChat}
                    className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-45"
                    title="Send message"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-6 6m6-6l6 6" />
                    </svg>
                  </button>
                </div>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={(event) => setFile(event.target.files?.[0] || null)}
                  className="hidden"
                />
              </form>
            </div>
          </div>
        </section>
      </div>

      {showSettings ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 px-3 py-3 backdrop-blur-md sm:px-4 sm:py-6">
          <div className="relative flex h-[min(94dvh,760px)] w-full max-w-7xl flex-col overflow-hidden rounded-lg border border-white/10 bg-[#0d121b]/95 shadow-[0_30px_90px_rgba(0,0,0,0.55)] md:flex-row">
            <button
              type="button"
              onClick={() => setShowSettings(false)}
              className="absolute right-4 top-4 z-10 rounded-full border border-white/10 bg-black/30 px-3 py-2 text-xs text-slate-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              Close
            </button>

            <aside className="flex max-h-[34dvh] w-full shrink-0 flex-col border-b border-white/10 bg-[#0c1118] p-4 md:max-h-none md:w-65 md:border-b-0 md:border-r">
              <div className="mb-4 pr-16 md:pr-0">
                <p className="text-[10px] uppercase tracking-[0.38em] text-slate-500">Settings</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">Account</h3>
                <p className="mt-2 text-sm text-slate-400">Manage your chats, usage, and account controls.</p>
              </div>

              <nav className="flex gap-2 overflow-x-auto pb-1 pr-1 md:block md:space-y-1 md:overflow-y-auto md:pb-0">
                {settingsSections.map((section) => (
                  <button
                    key={section}
                    type="button"
                    onClick={() => setSettingsSection(section)}
                    className={`flex min-w-fit items-center justify-between gap-4 rounded-lg px-3 py-3 text-left text-sm transition md:w-full ${
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

              <div className="mt-4 hidden rounded-lg border border-white/10 bg-white/5 p-4 md:block">
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
                <header className="border-b border-white/10 px-4 py-4 sm:px-6 sm:py-5">
                  <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500">Control center</p>
                  <h4 className="mt-2 text-2xl font-semibold text-white">{settingsSection}</h4>
                  <p className="mt-2 text-sm text-slate-400">
                    Control your account from one floating panel while keeping the chat visible behind it.
                  </p>
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
                  {settingsLoading ? (
                    <div className="rounded-lg border border-white/10 bg-white/5 p-6 text-slate-400">
                      Loading account settings...
                    </div>
                  ) : settingsError ? (
                    <div className="rounded-lg border border-rose-400/20 bg-rose-400/10 p-6 text-rose-100">
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
                              <div key={item.label} className="rounded-lg border border-white/10 bg-white/5 p-5">
                                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{item.label}</p>
                                <p className="mt-3 text-4xl font-semibold text-white">{item.value}</p>
                              </div>
                            ))}
                          </section>

                          <section className="rounded-lg border border-white/10 bg-white/5 p-5">
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
                              <p className="mt-4 rounded-lg border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                                {settingsGeneralError}
                              </p>
                            ) : null}

                            {settingsGeneralMessage ? (
                              <p className="mt-4 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                                {settingsGeneralMessage}
                              </p>
                            ) : null}
                          </section>

                          <section className="rounded-lg border border-white/10 bg-white/5 p-5">
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
                              <div className="rounded-lg border border-white/10 bg-[#0b0f17] p-4">
                                <p className="text-sm text-slate-400">Name</p>
                                <p className="mt-1 text-base text-white">{settingsData?.profile?.name || displayName || "User"}</p>
                              </div>
                              <div className="rounded-lg border border-white/10 bg-[#0b0f17] p-4">
                                <p className="text-sm text-slate-400">Username</p>
                                <p className="mt-1 text-base text-white">{settingsData?.profile?.username || "unknown"}</p>
                              </div>
                            </div>
                          </section>
                        </>
                      ) : null}

                      {settingsSection === "Chats" ? (
                        <section className="rounded-lg border border-white/10 bg-white/5 p-5">
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
                              <div className="rounded-lg border border-dashed border-white/10 bg-[#0b0f17] p-5 text-sm text-slate-400">
                                No chats saved yet.
                              </div>
                            ) : (
                              settingsData.chats.map((chat) => (
                                <div
                                  key={chat._id}
                                  className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-[#0b0f17] px-4 py-3"
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
                          <section className="rounded-lg border border-white/10 bg-white/5 p-5">
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
                                  className="w-full rounded-lg border border-white/10 bg-[#0b0f17] px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-amber-400/50"
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
                                    className="w-full rounded-lg border border-white/10 bg-[#0b0f17] px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-amber-400/50"
                                    placeholder="Current password"
                                  />
                                </label>

                                <label className="block space-y-2">
                                  <span className="text-sm text-slate-300">New password</span>
                                  <input
                                    type="password"
                                    value={settingsNewPassword}
                                    onChange={(event) => setSettingsNewPassword(event.target.value)}
                                    className="w-full rounded-lg border border-white/10 bg-[#0b0f17] px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-amber-400/50"
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
                                  className="w-full rounded-lg border border-white/10 bg-[#0b0f17] px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-amber-400/50"
                                  placeholder="Confirm new password"
                                />
                              </label>

                              {settingsUpdateError ? (
                                <p className="rounded-lg border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                                  {settingsUpdateError}
                                </p>
                              ) : null}

                              {settingsUpdateMessage ? (
                                <p className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                                  {settingsUpdateMessage}
                                </p>
                              ) : null}

                              <button
                                type="submit"
                                disabled={settingsUpdatingAccount}
                                className="w-full rounded-full border border-amber-300/30 bg-amber-400/15 px-4 py-2.5 text-sm font-medium text-amber-50 transition hover:bg-amber-400/25 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                              >
                                {settingsUpdatingAccount ? "Updating..." : "Update account"}
                              </button>
                            </form>
                          </section>

                          <section className="rounded-lg border border-rose-400/20 bg-rose-400/10 p-5">
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
        <div className="fixed inset-0 z-60 flex items-center justify-center overflow-y-auto bg-black/75 px-3 py-6 backdrop-blur-md sm:px-4">
          <div className="w-full max-w-md rounded-lg border border-white/10 bg-[#0d121b]/95 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.55)]">
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
                  className="w-full rounded-lg border border-white/10 bg-[#0b0f17] px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-amber-400/50"
                  placeholder="Enter chat name"
                />
              </label>
            ) : null}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
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

      {showWelcomeOverlay ? (
        <div className="fixed inset-0 z-60 flex items-center justify-center overflow-y-auto bg-black/70 px-3 py-4 backdrop-blur-md sm:px-4 sm:py-6">
          <div className="relative max-h-[94dvh] w-full max-w-6xl overflow-y-auto rounded-lg border border-white/10 bg-[#0d121b]/96 shadow-[0_30px_90px_rgba(0,0,0,0.55)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.12),transparent_30%),radial-gradient(circle_at_top_right,rgba(99,102,241,0.14),transparent_28%),radial-gradient(circle_at_bottom,rgba(255,255,255,0.03),transparent_45%)]" />
            <div className="relative grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="border-b border-white/10 p-6 sm:p-8 lg:border-b-0 lg:border-r">
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-100">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  Welcome experience
                </div>

                <h2 className="mt-5 max-w-2xl text-3xl font-semibold text-white sm:text-5xl">
                  Built for faster revision, clearer notes, and better answers.
                </h2>

                <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                  Hey <span className="text-amber-300">{displayName || "there"}</span>, your workspace is ready. Start with a question, attach a document when you need grounded answers, or just explore with general study help.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <button
                    type="button"
                    onClick={() => void handleWelcomeStart()}
                    disabled={welcomeSaving}
                    className="rounded-full border border-amber-400/30 bg-amber-400/15 px-5 py-3 text-sm font-medium text-amber-50 transition hover:bg-amber-400/25 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {welcomeSaving ? "Entering..." : "Enter workspace"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowWelcomeOverlay(false)}
                    className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-100 transition hover:border-white/20 hover:bg-white/10"
                  >
                    Maybe later
                  </button>
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  {[
                    { label: "Chat mode", value: "General knowledge" },
                    { label: "Uploads", value: "Optional" },
                    { label: "Theme", value: "Dark editorial" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                      <p className="text-[10px] uppercase tracking-[0.32em] text-slate-500">{item.label}</p>
                      <p className="mt-2 text-sm font-semibold text-white">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 sm:p-8">
                <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.32em] text-slate-500">What you can do</p>
                  <div className="mt-4 space-y-3 text-sm text-slate-300">
                    <div className="flex items-start gap-3 rounded-lg border border-white/5 bg-[#0b0f17] px-3 py-3">
                      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-amber-400" />
                      <p>Ask general questions without a PDF.</p>
                    </div>
                    <div className="flex items-start gap-3 rounded-lg border border-white/5 bg-[#0b0f17] px-3 py-3">
                      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-indigo-400" />
                      <p>Attach a document later and switch to grounded answers.</p>
                    </div>
                    <div className="flex items-start gap-3 rounded-lg border border-white/5 bg-[#0b0f17] px-3 py-3">
                      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-400" />
                      <p>Keep chats organized in the sidebar and return anytime.</p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-lg border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                    The chats page stays mounted behind this panel, so nothing navigates away.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
