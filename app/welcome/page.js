"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./welcome.module.css";

export default function WelcomePage() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAnimated, setIsAnimated] = useState(false);

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
              Welcome experience
            </div>
            <div className={styles.statusPill}>
              {loading ? "Syncing profile" : "Ready"}
            </div>
          </div>

          <div className={styles.heroGrid}>
            <section className={styles.welcomeBox}>
              <p className={styles.kicker}>StudyAssistant</p>
              <h1 className={styles.title}>
                Built for faster revision, clearer notes, and better answers.
              </h1>

              <p className={styles.greeting}>
                Hey <span className={styles.userName}>{userLabel}</span>, your workspace is ready.
              </p>

              <p className={styles.description}>
                Start with a question, attach a document when you need grounded answers, or just explore with general study help.
              </p>

              <div className={styles.ctaRow}>
                <button className={styles.button} onClick={handleGetStarted}>
                  Enter workspace
                </button>
                <div className={styles.helperText}>
                  Fast chat setup, dark editorial UI, and no clutter.
                </div>
              </div>
            </section>

            <aside className={styles.sidePanel}>
              <div className={styles.summaryCard}>
                <p className={styles.summaryLabel}>What&apos;s inside</p>
                <div className={styles.summaryList}>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryIcon}>01</span>
                    <span>General study chat without a PDF</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryIcon}>02</span>
                    <span>Upload documents when you want grounded answers</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryIcon}>03</span>
                    <span>Quick prompts, chat history, and account controls</span>
                  </div>
                </div>
              </div>

              <div className={styles.features}>
                <div className={styles.feature}>
                  <div className={styles.featureIcon}>1</div>
                  <div className={styles.featureText}>
                    <h3>Start instantly</h3>
                    <p>No required upload before your first question.</p>
                  </div>
                </div>

                <div className={styles.feature}>
                  <div className={styles.featureIcon}>2</div>
                  <div className={styles.featureText}>
                    <h3>Grounded when needed</h3>
                    <p>Add a PDF later and the chat switches to document mode.</p>
                  </div>
                </div>

                <div className={styles.feature}>
                  <div className={styles.featureIcon}>3</div>
                  <div className={styles.featureText}>
                    <h3>Keep working</h3>
                    <p>Your chats stay organized in the sidebar for quick return.</p>
                  </div>
                </div>
              </div>
            </aside>
          </div>

          <p className={styles.footer}>
            Your study session starts in one click. Make it count.
          </p>
        </div>
      </div>
    </div>
  );
}
