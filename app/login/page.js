"use client";

import Link from "next/link";
import { useState } from "react";

const sessionPoints = [
	["Saved chats", "Return to previous study threads."],
	["PDF context", "Continue document-backed questions."],
	["Account tools", "Review settings and usage controls."],
];

const recentItems = [
	["Recent chat", "Thermodynamics notes"],
	["Workspace mode", "PDF attached"],
	["Suggested next step", "Ask a follow-up"],
];

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
		<main className="hero-pattern min-h-screen text-foreground">
			<header className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-8 lg:px-10">
				<Link href="/" className="flex items-center gap-3">
					<span className="grid h-10 w-10 place-items-center rounded-lg border border-amber-300/25 bg-amber-300/12 text-sm font-black text-amber-200">
						SA
					</span>
					<span>
						<span className="block text-sm font-semibold text-white">Study Assistant</span>
						<span className="block text-xs text-muted">Secure workspace login</span>
					</span>
				</Link>

				<Link href="/signup" className="btn-secondary px-4 py-2 text-sm">
					Create account
				</Link>
			</header>

			<section className="mx-auto grid min-h-[calc(100vh-73px)] w-full max-w-7xl items-center gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[0.86fr_1.14fr] lg:px-10">
				<div className="product-frame fade-in-up order-2 p-5 sm:p-6 lg:order-1">
					<div className="border-b border-white/10 pb-5">
						<p className="eyebrow">Login</p>
						<h1 className="mt-5 text-3xl font-semibold leading-tight text-white sm:text-4xl">
							Welcome back to your study desk.
						</h1>
						<p className="mt-3 text-sm leading-7 text-muted">
							Enter your account details to reopen saved chats, attached PDFs, and
							revision sessions.
						</p>
					</div>

					<form className="mt-6 space-y-5" onSubmit={handleSubmit}>
						<label className="block space-y-2">
							<span className="text-sm font-medium text-white/90">Username</span>
							<input
								type="text"
								value={username}
								onChange={(event) => setUsername(event.target.value)}
								className="w-full rounded-lg border border-white/10 bg-[#101624] px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-[#f0b35e]"
								placeholder="ankesh"
								autoComplete="username"
							/>
						</label>

						<label className="block space-y-2">
							<span className="text-sm font-medium text-white/90">Password</span>
							<input
								type="password"
								value={password}
								onChange={(event) => setPassword(event.target.value)}
								className="w-full rounded-lg border border-white/10 bg-[#101624] px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-[#f0b35e]"
								placeholder="Enter your password"
								autoComplete="current-password"
							/>
						</label>

						{error ? (
							<p className="rounded-lg border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
								{error}
							</p>
						) : null}

						<button
							type="submit"
							disabled={loading}
							className="btn-primary w-full px-5 py-3.5 disabled:cursor-not-allowed disabled:opacity-60"
						>
							{loading ? "Signing in..." : "Log in"}
						</button>
					</form>

					<p className="mt-5 text-sm text-muted">
						New here?{" "}
						<Link href="/signup" className="font-medium text-[#f0b35e] transition hover:text-[#ffbf71]">
							Create an account
						</Link>
					</p>
				</div>

				<div className="order-1 lg:order-2">
					<div className="fade-in-up [animation-delay:100ms]">
						<p className="eyebrow">Continue studying</p>
						<h2 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
							Pick up exactly where your last revision session stopped.
						</h2>
						<p className="mt-5 max-w-2xl text-base leading-8 text-muted">
							Login keeps the product focused: your chats, PDFs, account controls,
							and study prompts are waiting in the workspace.
						</p>
					</div>

					<div className="mt-8 grid gap-3 sm:grid-cols-3">
						{sessionPoints.map(([title, text]) => (
							<article key={title} className="surface-card p-4">
								<h3 className="text-sm font-semibold text-white">{title}</h3>
								<p className="mt-2 text-sm leading-6 text-muted">{text}</p>
							</article>
						))}
					</div>

					<div className="mt-6 rounded-lg border border-white/10 bg-[#0b111d]/90 p-4">
						<div className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
							<div>
								<p className="text-xs uppercase tracking-[0.28em] text-muted">Workspace preview</p>
								<h3 className="mt-2 text-xl font-semibold text-white">After login</h3>
							</div>
							<span className="w-fit rounded-lg border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-medium text-emerald-200">
								Ready
							</span>
						</div>
						<div className="mt-4 grid gap-2">
							{recentItems.map(([label, value]) => (
								<div key={label} className="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-black/20 px-3 py-2">
									<span className="text-xs text-muted">{label}</span>
									<span className="text-sm font-medium text-white">{value}</span>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>
		</main>
	);
}
