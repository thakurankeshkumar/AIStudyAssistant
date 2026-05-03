"use client";

import Link from "next/link";
import { useState } from "react";

const onboardingSteps = [
	["Profile", "Create your protected account."],
	["Workspace", "Move straight into the chat dashboard."],
	["First session", "Ask generally or attach a PDF."],
];

const benefits = [
	["PDF-ready", "Use document context when answers need to stay grounded."],
	["History saved", "Keep every useful chat available for later revision."],
	["Account control", "Manage stats, profile details, and deletion flows."],
];

export default function SignupPage() {
	const [name, setName] = useState("");
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const handleSubmit = async (event) => {
		event.preventDefault();
		setError("");

		if (!name || !username || !password) {
			setError("Enter your name, username and password.");
			return;
		}

		setLoading(true);

		try {
			const response = await fetch("/api/auth/signup", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
				body: JSON.stringify({ name, username, password }),
			});

			const data = await response.json();

			if (!response.ok) {
				setError(data.error || "Signup failed.");
				return;
			}

			window.location.assign("/home");
		} catch (requestError) {
			setError(requestError.message || "Signup failed.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<main className="hero-pattern min-h-screen text-foreground">
			<header className="flex flex-col items-stretch gap-4 border-b border-white/10 px-5 py-4 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between sm:px-8 lg:px-10">
				<Link href="/" className="flex min-w-0 items-center gap-3">
					<span className="grid h-10 w-10 place-items-center rounded-lg border border-amber-300/25 bg-amber-300/12 text-sm font-black text-amber-200">
						SA
					</span>
					<span className="min-w-0">
						<span className="block text-sm font-semibold text-white">Study Assistant</span>
						<span className="block truncate text-xs text-muted">Create workspace</span>
					</span>
				</Link>

				<Link href="/login" className="btn-secondary px-4 py-2 text-sm">
					Log in
				</Link>
			</header>

			<section className="mx-auto grid min-h-[calc(100dvh-73px)] w-full max-w-7xl items-center gap-8 px-5 py-8 sm:px-8 sm:py-10 lg:grid-cols-[0.9fr_1.1fr] lg:px-10">
				<div>
					<div className="fade-in-up">
						<p className="eyebrow">Create account</p>
						<h1 className="mt-5 max-w-3xl text-3xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
							Build a clean study workspace in one step.
						</h1>
						<p className="mt-5 max-w-2xl text-base leading-8 text-muted">
							Sign up once, then start a general study chat or attach lecture PDFs
							for grounded answers.
						</p>
					</div>

					<div className="mt-8 grid gap-3 sm:grid-cols-3">
						{onboardingSteps.map(([title, text], index) => (
							<article key={title} className="surface-card p-4">
								<span className="text-xs font-semibold text-amber-200">0{index + 1}</span>
								<h2 className="mt-4 text-sm font-semibold text-white">{title}</h2>
								<p className="mt-2 text-sm leading-6 text-muted">{text}</p>
							</article>
						))}
					</div>

					<div className="mt-6 rounded-lg border border-white/10 bg-[#0b111d]/90 p-4">
						<p className="text-xs uppercase tracking-[0.28em] text-muted">What you get</p>
						<div className="mt-4 grid gap-3 md:grid-cols-3">
							{benefits.map(([title, text]) => (
								<div key={title} className="rounded-lg border border-white/10 bg-black/20 p-3">
									<h3 className="text-sm font-semibold text-white">{title}</h3>
									<p className="mt-2 text-xs leading-5 text-muted">{text}</p>
								</div>
							))}
						</div>
					</div>
				</div>

				<div className="product-frame fade-in-up p-5 sm:p-6 [animation-delay:120ms]">
					<div className="border-b border-white/10 pb-5">
						<p className="text-xs uppercase tracking-[0.32em] text-muted">New workspace</p>
						<h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Sign up</h2>
						<p className="mt-3 text-sm leading-6 text-muted">
							Your account is created and signed in through the existing signup route.
						</p>
					</div>

					<form className="mt-6 space-y-5" onSubmit={handleSubmit}>
						<label className="block space-y-2">
							<span className="text-sm font-medium text-white/90">Name</span>
							<input
								type="text"
								value={name}
								onChange={(event) => setName(event.target.value)}
								className="w-full rounded-lg border border-white/10 bg-[#101624] px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-[#f0b35e]"
								placeholder="Ankesh Kumar"
								autoComplete="name"
							/>
						</label>

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
								placeholder="Choose a strong password"
								autoComplete="new-password"
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
							{loading ? "Creating account..." : "Sign up"}
						</button>
					</form>

					<p className="mt-5 text-sm text-muted">
						Already have an account?{" "}
						<Link href="/login" className="font-medium text-[#f0b35e] transition hover:text-[#ffbf71]">
							Log in
						</Link>
					</p>
				</div>
			</section>
		</main>
	);
}
