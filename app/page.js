import Link from "next/link";

const features = [
  {
    title: "Upload study material",
    description: "Send a PDF to the assistant and turn it into a searchable context.",
  },
  {
    title: "Ask grounded questions",
    description: "Questions are answered from the uploaded document instead of generic web text.",
  },
  {
    title: "Protected sessions",
    description: "Signup and login use JWT-backed REST routes and httpOnly cookies.",
  },
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden text-foreground">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,183,77,0.14),transparent_34%),radial-gradient(circle_at_80%_20%,rgba(72,111,255,0.16),transparent_28%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6 lg:px-10">
        <header className="flex items-center justify-between gap-4 border-b border-white/10 py-4 backdrop-blur-sm">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-muted">Study Assistant</p>
            <h1 className="mt-2 text-lg font-semibold text-white">Focused learning workspace</h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link
              href="/login"
              className="rounded-full border border-white/12 bg-white/5 px-4 py-2 text-white/90 transition hover:border-white/25 hover:bg-white/10"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-[#f0b35e] px-4 py-2 font-medium text-slate-950 transition hover:bg-[#ffbf71]"
            >
              Sign up
            </Link>
          </div>
        </header>

        <section className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.15fr_0.85fr] lg:py-16">
          <div className="max-w-3xl">
            <p className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.35em] text-muted">
              PDF-based study assistant
            </p>
            <h2 className="mt-8 text-5xl font-semibold leading-tight text-white md:text-7xl">
              Read less noise.
              <span className="block text-[#f0b35e]">Ask better questions.</span>
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-8 text-muted md:text-lg">
              Upload lecture notes, get grounded answers, and stay inside one clean workspace.
              The login and signup routes are connected to the existing REST API, so the flow works end to end.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/signup"
                className="rounded-full bg-[#f0b35e] px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-[#ffbf71]"
              >
                Create account
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-white/12 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/25 hover:bg-white/10"
              >
                I already have an account
              </Link>
            </div>

            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {features.map((feature) => (
                <article
                  key={feature.title}
                  className="rounded-2xl border border-white/10 bg-surface p-5 shadow-[0_20px_60px_rgba(0,0,0,0.24)] backdrop-blur"
                >
                  <h3 className="text-base font-semibold text-white">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted">{feature.description}</p>
                </article>
              ))}
            </div>
          </div>

          <aside className="rounded-4xl border border-white/10 bg-surface-strong p-6 shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur md:p-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-5">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-muted">Flow</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">Three steps to answers</h3>
              </div>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
                Ready
              </span>
            </div>

            <div className="mt-6 space-y-4">
              {[
                ["01", "Sign up", "Create a session with the signup route and get a JWT cookie."],
                ["02", "Upload PDF", "Send a PDF to /api/upload and store parsed chunks."],
                ["03", "Ask", "Question the document through /api/ask for grounded answers."],
              ].map(([number, title, text]) => (
                <div key={title} className="rounded-2xl border border-white/8 bg-white/5 p-4">
                  <div className="flex items-center gap-4">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f0b35e] text-sm font-bold text-slate-950">
                      {number}
                    </span>
                    <div>
                      <h4 className="font-semibold text-white">{title}</h4>
                      <p className="mt-1 text-sm leading-6 text-muted">{text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}