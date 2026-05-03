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
    <main className="h-screen overflow-hidden bg-[#0b0f17] text-slate-100">
      <div className="flex h-full min-h-0 flex-col lg:flex-row">
        <aside className="flex min-h-0 flex-col border-b border-white/10 bg-[#0d121b] lg:h-full lg:w-[320px] lg:border-b-0 lg:border-r">
          <div className="flex min-h-0 flex-1 flex-col p-4">
            <div className="rounded-lg border border-white/10 bg-linear-to-br from-[#141c2b] to-[#101726] p-3 shadow-lg shadow-black/25">
              <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400">Study Assistant</p>
                  <h1 className="mt-1 truncate text-lg font-semibold text-white">Chats</h1>
                </div>
                <button
                  type="button"
                  onClick={handleNewChat}
                  disabled={creatingChat}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition hover:border-amber-400/40 hover:bg-amber-400/15 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {creatingChat ? "Creating..." : "New"}
                </button>
              </div>

              <div className="mt-3 rounded-lg border border-white/10 bg-[#0e1523] px-3 py-2">
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  <svg className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
                  </svg>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search chats"
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                  />
                </label>
              </div>

              <div className="mt-3 flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-400">
                <span>{historyLoading ? "Loading chats..." : `${visibleHistory.length} shown`}</span>
                {searchTerm.trim() ? (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-slate-300 transition hover:bg-white/10"
                  >
                    Clear search
                  </button>
                ) : (
                  <span>{history.length} total</span>
                )}
              </div>
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

            <div className="mt-4 space-y-3 rounded-lg border border-white/10 bg-white/5 p-4">
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
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 lg:px-8">
              <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
                {showWelcomePanel ? (
                  <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
                    <div className="max-w-3xl space-y-8">
                      <div className="space-y-3">
                        <div className="mx-auto grid h-16 w-16 place-items-center rounded-lg border border-amber-300/25 bg-amber-300/12 text-lg font-black text-amber-200">
                          SA
                        </div>
                        <h3 className="text-3xl font-bold text-white sm:text-4xl">
                          {welcomeCopy.greeting}
                        </h3>
                        <p className="mx-auto max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
                          {welcomeCopy.message}
                        </p>
                      </div>

                      <div className="space-y-3 text-left">
                        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Quick start prompts</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {starterPrompts.map((prompt) => (
                            <button
                              key={prompt}
                              type="button"
                              onClick={() => setQuestion(prompt)}
                              className="group relative rounded-lg border border-white/10 bg-linear-to-br from-white/5 to-white/2 px-4 py-4 text-left text-sm text-slate-200 transition-all duration-300 hover:border-amber-400/30 hover:from-amber-400/10 hover:to-amber-400/5"
                            >
                              <span className="font-medium group-hover:text-white">{prompt}</span>
                              <div className="absolute right-3 top-3 rounded-full bg-amber-400/0 p-2 text-amber-400 transition-all group-hover:bg-amber-400/10">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : selectedChat?.messages?.length > 0 ? (
                  <div className="space-y-4">
                    {selectedChat.messages.map((message, index) => (
                      <div
                        key={`${selectedChat._id}-${index}`}
                        className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`flex gap-3 max-w-[85%] sm:max-w-[75%] ${
                            message.role === "user" ? "flex-row-reverse" : "flex-row"
                          }`}
                        >
                          {message.role === "assistant" && (
                            <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-indigo-500 to-purple-500 text-xs font-bold text-white">
                              AI
                            </div>
                          )}
                          
                          <div
                            className={`rounded-lg px-5 py-3 ${
                              message.role === "user"
                                ? "rounded-br-sm border border-amber-400/30 bg-linear-to-br from-amber-400/20 to-amber-400/10 text-amber-50 shadow-lg shadow-amber-500/10"
                                : "rounded-bl-sm border border-slate-700/50 bg-linear-to-br from-slate-800 to-slate-900 text-slate-100 shadow-lg shadow-black/20"
                            }`}
                          >
                            <p className="whitespace-pre-wrap text-sm leading-7 sm:text-[15px] wrap-break-word">
                              {message.content}
                            </p>
                          </div>

                          {message.role === "user" && (
                            <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-amber-400/40 to-amber-500/40 text-xs font-bold text-amber-200">
                              You
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex min-h-64 items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/3 px-6 py-12 text-center">
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

            <div className="shrink-0 border-t border-white/10 bg-linear-to-t from-[#0c111a] to-[#0b0f17]/50 px-4 py-4 backdrop-blur lg:px-8">
              <form
                onSubmit={handleSend}
                className="mx-auto flex w-full max-w-4xl flex-col gap-3 rounded-lg border border-white/10 bg-[#101624] p-3 shadow-xl shadow-black/20"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading || creatingChat || uploading}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {file ? "Change PDF" : "Attach PDF"}
                  </button>

                  {showUploadAction ? (
                    <button
                      type="button"
                      onClick={handleUpload}
                      disabled={uploading}
                      className="rounded-full border border-amber-400/30 bg-amber-400/15 px-3 py-1.5 text-xs font-medium text-amber-100 transition hover:bg-amber-400/25 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {uploading ? "Uploading..." : "Upload PDF"}
                    </button>
                  ) : null}

                  <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-slate-400">
                    {file ? file.name : selectedChat?.fileId ? "Chat PDF attached" : "No draft file"}
                  </span>

                  {file ? (
                    <button
                      type="button"
                      onClick={clearPendingFileSelection}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white/10"
                    >
                      Clear
                    </button>
                  ) : null}
                </div>

                <div className="flex items-end gap-3">
                  <div className="flex-1 rounded-lg border border-white/10 bg-[#101624] px-5 py-2 transition focus-within:border-amber-400/30 focus-within:bg-[#111a27] shadow-lg shadow-black/20">
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
                      placeholder="Ask anything about your PDF..."
                      rows={2}
                      className="min-h-12 max-h-40 w-full resize-none bg-transparent text-sm text-white outline-none placeholder:text-slate-500 sm:text-[15px]"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={loading || creatingChat}
                      className="flex items-center justify-center rounded-full bg-white p-3 text-slate-950 transition hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Send message"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-md">
          <div className="relative flex h-[min(86vh,760px)] w-full max-w-7xl overflow-hidden rounded-lg border border-white/10 bg-[#0d121b]/95 shadow-[0_30px_90px_rgba(0,0,0,0.55)]">
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
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-sm transition ${
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

              <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-4">
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
                                className="rounded-full border border-amber-300/30 bg-amber-400/15 px-4 py-2.5 text-sm font-medium text-amber-50 transition hover:bg-amber-400/25 disabled:cursor-not-allowed disabled:opacity-60"
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
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-md">
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

      {showWelcomeOverlay ? (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-md">
          <div className="relative w-full max-w-6xl overflow-hidden rounded-lg border border-white/10 bg-[#0d121b]/96 shadow-[0_30px_90px_rgba(0,0,0,0.55)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.12),transparent_30%),radial-gradient(circle_at_top_right,rgba(99,102,241,0.14),transparent_28%),radial-gradient(circle_at_bottom,rgba(255,255,255,0.03),transparent_45%)]" />
            <div className="relative grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="border-b border-white/10 p-6 sm:p-8 lg:border-b-0 lg:border-r">
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-100">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  Welcome experience
                </div>

                <h2 className="mt-5 max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  Built for faster revision, clearer notes, and better answers.
                </h2>

                <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                  Hey <span className="text-amber-300">{displayName || "there"}</span>, your workspace is ready. Start with a question, attach a document when you need grounded answers, or just explore with general study help.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
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
