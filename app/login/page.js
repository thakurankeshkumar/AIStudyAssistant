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
	const [showPassword, setShowPassword] = useState(false);
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
				<Link href="/" className="flex min-w-0 items-center gap-3">
					<span className="grid h-10 w-10 place-items-center rounded-lg border border-amber-300/25 bg-amber-300/12 text-sm font-black text-amber-200">
						SA
					</span>
					<span className="min-w-0">
						<span className="block text-sm font-semibold text-white">Study Assistant</span>
						<span className="block truncate text-xs text-muted">Secure workspace login</span>
					</span>
				</Link>

				<Link href="/signup" className="btn-secondary hidden px-4 py-2 text-sm sm:inline-flex">
					Create account
				</Link>
			</header>

			<section className="mx-auto grid min-h-[calc(100dvh-73px)] w-full max-w-7xl items-center gap-8 px-5 py-6 sm:px-8 sm:py-10 lg:grid-cols-[0.86fr_1.14fr] lg:px-10">
				<div className="product-frame landing-preview fade-in-up p-5 sm:p-6 lg:order-1">
					<div className="border-b border-white/10 pb-4 sm:pb-5">
						<p className="eyebrow">Login</p>
						<h1 className="mt-4 text-2xl font-semibold leading-tight text-white sm:mt-5 sm:text-4xl">
							Welcome back to your study desk.
						</h1>
						<p className="mt-3 text-sm leading-6 text-muted sm:leading-7">
							Enter your account details to reopen saved chats, attached PDFs, and
							revision sessions.
						</p>
					</div>

					<form className="mt-5 space-y-4 sm:mt-6 sm:space-y-5" onSubmit={handleSubmit}>
						<label className="block space-y-2">
							<span className="text-sm font-medium text-white/90">Username</span>
							<input
								type="text"
								value={username}
								onChange={(event) => setUsername(event.target.value)}
								className="w-full rounded-lg border border-white/10 bg-[#101624] px-4 py-3 text-white outline-none transition placeholder:text-white/35 hover:border-white/20 focus:border-[#f0b35e] focus:shadow-[0_0_0_3px_rgba(240,179,94,0.12)]"
								placeholder="Enter your username"
								autoComplete="username"
							/>
						</label>

						<label className="block space-y-2">
							<span className="text-sm font-medium text-white/90">Password</span>
							<span className="relative block">
								<input
									type={showPassword ? "text" : "password"}
									value={password}
									onChange={(event) => setPassword(event.target.value)}
									className="w-full rounded-lg border border-white/10 bg-[#101624] px-4 py-3 pr-24 text-white outline-none transition placeholder:text-white/35 hover:border-white/20 focus:border-[#f0b35e] focus:shadow-[0_0_0_3px_rgba(240,179,94,0.12)]"
									placeholder="Enter your password"
									autoComplete="current-password"
								/>
								<button
									type="button"
									onClick={() => setShowPassword((current) => !current)}
									className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-3 py-1.5 text-xs font-medium text-amber-100 transition hover:bg-amber-300/10"
								>
									{showPassword ? "Hide" : "Show"}
								</button>
							</span>
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

				<div className="hidden lg:order-2 lg:block">
					<div className="fade-in-up [animation-delay:100ms]">
						<p className="eyebrow">Continue studying</p>
						<h2 className="mt-5 max-w-3xl text-3xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
							Pick up exactly where your last revision session stopped.
						</h2>
						<p className="mt-5 max-w-2xl text-base leading-8 text-muted">
							Login keeps the product focused: your chats, PDFs, account controls,
							and study prompts are waiting in the workspace.
						</p>
					</div>

					<div className="mt-8 grid gap-3 sm:grid-cols-3">
						{sessionPoints.map(([title, text]) => (
							<article key={title} className="surface-card interactive-card p-4">
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
									<span className="min-w-0 text-right text-sm font-medium text-white">{value}</span>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>
		</main>
	);
}
