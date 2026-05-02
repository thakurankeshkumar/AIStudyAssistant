"use client";

import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const handleSubmit = async (event) => {
		event.preventDefault();
		setError("");

		if (!username || !password) {
			setError("Enter both username and password.");
			return;
		}

		setLoading(true);

		try {
			const response = await fetch("/api/auth/login", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
				body: JSON.stringify({ username, password }),
			});

			const data = await response.json();

			if (!response.ok) {
				setError(data.error || "Login failed.");
				return;
			}

			window.location.assign("/home");
		} catch (requestError) {
			setError(requestError.message || "Login failed.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<main className="relative min-h-screen overflow-hidden px-6 py-10 text-[var(--foreground)] lg:px-10">
			<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(240,179,94,0.16),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(72,111,255,0.16),_transparent_28%)]" />
			<div className="relative mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
				<section className="space-y-6">
					<Link href="/" className="inline-flex items-center gap-2 text-sm text-[var(--muted)] transition hover:text-white">
						<span className="text-lg">←</span>
						Back to landing
					</Link>
					<p className="text-xs uppercase tracking-[0.4em] text-[var(--muted)]">Welcome back</p>
					<h1 className="max-w-xl text-5xl font-semibold leading-tight text-white md:text-6xl">
						Log in and reopen your study workspace.
					</h1>
					<p className="max-w-xl text-base leading-8 text-[var(--muted)] md:text-lg">
						Use the existing JWT-backed REST route to authenticate, then jump into your notes, uploads, and question flow.
					</p>
				</section>

				<section className="rounded-[2rem] border border-white/10 bg-[var(--surface-strong)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur md:p-8">
					<div className="border-b border-white/10 pb-5">
						<p className="text-xs uppercase tracking-[0.35em] text-[var(--muted)]">Login</p>
						<h2 className="mt-2 text-3xl font-semibold text-white">Access your account</h2>
					</div>

					<form className="mt-6 space-y-5" onSubmit={handleSubmit}>
						<label className="block space-y-2">
							<span className="text-sm font-medium text-white/90">Username</span>
							<input
								type="text"
								value={username}
								onChange={(event) => setUsername(event.target.value)}
								className="w-full rounded-2xl border border-white/10 bg-[#101624] px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-[#f0b35e]"
								placeholder="testuser"
								autoComplete="username"
							/>
						</label>

						<label className="block space-y-2">
							<span className="text-sm font-medium text-white/90">Password</span>
							<input
								type="password"
								value={password}
								onChange={(event) => setPassword(event.target.value)}
								className="w-full rounded-2xl border border-white/10 bg-[#101624] px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-[#f0b35e]"
								placeholder="••••••••"
								autoComplete="current-password"
							/>
						</label>

						{error ? (
							<p className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
								{error}
							</p>
						) : null}

						<button
							type="submit"
							disabled={loading}
							className="w-full rounded-2xl bg-[#f0b35e] px-5 py-3.5 font-semibold text-slate-950 transition hover:bg-[#ffbf71] disabled:cursor-not-allowed disabled:opacity-60"
						>
							{loading ? "Signing in..." : "Log in"}
						</button>
					</form>

					<p className="mt-5 text-sm text-[var(--muted)]">
						Need an account?{" "}
						<Link href="/signup" className="font-medium text-[#f0b35e] transition hover:text-[#ffbf71]">
							Sign up here
						</Link>
						.
					</p>
				</section>
			</div>
		</main>
	);
}
