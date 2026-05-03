"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./welcome.module.css";

const welcomeSteps = [
  ["01", "Start with any question", "Use the chat immediately, even before uploading notes."],
  ["02", "Attach PDFs when needed", "Switch into grounded document answers as soon as you add material."],
  ["03", "Keep every session", "Return to saved chats, rename them, or clean them up later."],
];

const previewPrompts = [
  "Summarize unit 3 in simple words.",
  "Make five exam questions from this PDF.",
  "Build a 20 minute revision plan.",
];

export default function WelcomePage() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAnimated, setIsAnimated] = useState(false);
  const [isEntering, setIsEntering] = useState(false);

  const userLabel = useMemo(() => userName || "there", [userName]);

  useEffect(() => {
    let animationTimer;
    let isMounted = true;

    const loadProfile = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });

        if (response.status === 401) {
          router.push("/login");
          return;
        }

        if (!response.ok) {
          router.push("/home");
          return;
        }

        const data = await response.json();
        if (!isMounted) {
          return;
        }

        setUserName(data.name || data.username || "User");
      } catch (error) {
        console.error("Failed to load profile:", error);
        router.push("/home");
        return;
      } finally {
        if (!isMounted) {
          return;
        }

        setLoading(false);
        animationTimer = window.setTimeout(() => setIsAnimated(true), 60);
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
      if (animationTimer) {
        window.clearTimeout(animationTimer);
      }
    };
  }, [router]);

  const handleGetStarted = async () => {
    setIsEntering(true);

    try {
      const response = await fetch("/api/auth/welcome", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        console.error("Failed to mark welcome as seen");
      }

      router.push("/home");
    } catch (error) {
      console.error("Error:", error);
      router.push("/home");
    } finally {
      setIsEntering(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.shell}>
          <div className={styles.loaderPanel}>
            <div className={styles.loader}></div>
            <p>Preparing your study space...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.gridGlow} />
      <div className={`${styles.content} ${isAnimated ? styles.animated : ""}`}>
        <div className={styles.heroCard}>
          <div className={styles.heroTop}>
            <div className={styles.badge}>
              <span className={styles.badgeDot} />
              First workspace setup
            </div>
            <div className={styles.statusPill}>
              Ready for study
            </div>
          </div>

          <div className={styles.heroGrid}>
            <section className={styles.welcomeBox}>
              <p className={styles.kicker}>StudyAssistant</p>
              <h1 className={styles.title}>
                Welcome, <span className={styles.userName}>{userLabel}</span>.
              </h1>

              <p className={styles.greeting}>
                Your study desk is ready.
              </p>

              <p className={styles.description}>
                Ask a question, attach a PDF when you need grounded answers, and keep each revision session organized in one calm workspace.
              </p>

              <div className={styles.ctaRow}>
                <button className={styles.button} onClick={handleGetStarted} disabled={isEntering}>
                  {isEntering ? "Opening workspace..." : "Enter workspace"}
                </button>
                <div className={styles.helperText}>
                  Your first chat, upload tools, and account controls are waiting inside.
                </div>
              </div>
            </section>

            <aside className={styles.sidePanel}>
              <div className={styles.previewPanel}>
                <div className={styles.previewHeader}>
                  <span className={styles.logoMark}>SA</span>
                  <div>
                    <p>Live workspace</p>
                    <strong>New revision thread</strong>
                  </div>
                </div>
                <div className={styles.promptStack}>
                  {previewPrompts.map((prompt, index) => (
                    <div
                      key={prompt}
                      className={styles.promptBubble}
                      style={{ animationDelay: `${220 + index * 120}ms` }}
                    >
                      {prompt}
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.summaryCard}>
                <p className={styles.summaryLabel}>What happens next</p>
                <div className={styles.summaryList}>
                  {welcomeSteps.map(([number, title, text], index) => (
                    <div
                      key={title}
                      className={styles.summaryItem}
                      style={{ animationDelay: `${360 + index * 120}ms` }}
                    >
                      <span className={styles.summaryIcon}>{number}</span>
                      <span>
                        <strong>{title}</strong>
                        <small>{text}</small>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>

          <p className={styles.footer}>
            One click opens the dashboard. No setup detour, no clutter.
          </p>
        </div>
      </div>
    </div>
  );
}
