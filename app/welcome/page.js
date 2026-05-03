"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./welcome.module.css";

export default function WelcomePage() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAnimated, setIsAnimated] = useState(false);

  useEffect(() => {
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
        setUserName(data.name || data.username || "User");
        setLoading(false);
        
        // Trigger animation
        setTimeout(() => setIsAnimated(true), 100);
      } catch (error) {
        console.error("Failed to load profile:", error);
        router.push("/home");
      }
    };

    loadProfile();
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
        <div className={styles.loader}></div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={`${styles.content} ${isAnimated ? styles.animated : ""}`}>
        {/* Decorative gradient orb */}
        <div className={styles.orb}></div>

        {/* Main welcome content */}
        <div className={styles.welcomeBox}>
          <h1 className={styles.title}>
            Welcome to <span className={styles.highlight}>StudyAssistant</span>
          </h1>

          <p className={styles.greeting}>
            Hey <span className={styles.userName}>{userName}</span>! 👋
          </p>

          <p className={styles.description}>
            You're all set! StudyAssistant is your intelligent companion for smarter studying.
          </p>

          {/* Features */}
          <div className={styles.features}>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>📄</div>
              <div className={styles.featureText}>
                <h3>Upload Documents</h3>
                <p>Share PDFs and files to ask questions about</p>
              </div>
            </div>

            <div className={styles.feature}>
              <div className={styles.featureIcon}>💬</div>
              <div className={styles.featureText}>
                <h3>Ask Questions</h3>
                <p>Get instant answers powered by AI</p>
              </div>
            </div>

            <div className={styles.feature}>
              <div className={styles.featureIcon}>📚</div>
              <div className={styles.featureText}>
                <h3>Track Progress</h3>
                <p>Keep track of your chats and study history</p>
              </div>
            </div>

            <div className={styles.feature}>
              <div className={styles.featureIcon}>⚡</div>
              <div className={styles.featureText}>
                <h3>Quick Tips</h3>
                <p>Use pre-made prompts to jumpstart your session</p>
              </div>
            </div>
          </div>

          {/* Call to action */}
          <button className={styles.button} onClick={handleGetStarted}>
            Get Started
          </button>

          <p className={styles.footer}>
            Your study journey starts now. Make it count! 🎯
          </p>
        </div>
      </div>
    </div>
  );
}
