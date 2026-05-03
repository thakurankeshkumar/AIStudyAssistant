import Link from "next/link";

const metrics = [
  ["PDF-first answers", "Grounded in the documents students upload."],
  ["Saved chat threads", "Return to revision sessions without losing context."],
  ["Secure workspace", "Auth, account controls, and protected routes built in."],
  ["Fast study loops", "Summaries, questions, and explanations in one flow."],
];

const workflow = [
  {
    step: "01",
    title: "Upload notes",
    description: "Bring PDFs from lectures, units, assignments, or project references.",
  },
  {
    step: "02",
    title: "Ask naturally",
    description: "Use plain questions and let the assistant search the right context.",
  },
  {
    step: "03",
    title: "Revise actively",
    description: "Move from summaries to exam questions and focused explanations.",
  },
  {
    step: "04",
    title: "Keep history",
    description: "Rename, revisit, or delete chats as your semester evolves.",
  },
];

const productHighlights = [
  ["Document mode", "Attach a PDF to a chat and ask for answers shaped by that file."],
  ["General mode", "Start a study chat even before you upload any material."],
  ["Quick prompts", "Use starter prompts for summaries, exam questions, and revision plans."],
  ["Account controls", "Manage profile details, usage stats, chat history, and deletion flows."],
  ["Conversation memory", "Each chat keeps its messages, file state, and title together."],
  ["Focused interface", "Dark, compact surfaces keep long study sessions easy on the eyes."],
];

const useCases = [
  {
    title: "Lecture catch-up",
    copy: "Drop in a unit PDF and ask for the essential ideas before class starts.",
  },
  {
    title: "Exam preparation",
    copy: "Generate practice questions, simplify hard topics, and build revision plans.",
  },
  {
    title: "Project viva",
    copy: "Turn project reports into likely questions, definitions, and crisp explanations.",
  },
];

const outcomes = [
  ["Understand faster", "Ask for simpler explanations when lecture language feels too dense."],
  ["Practice smarter", "Generate questions from the same file so revision stays relevant."],
  ["Stay organized", "Keep each subject, unit, or project in its own saved thread."],
  ["Control your data", "Use account tools to review stats, delete chats, or remove the account."],
];

const studyStack = [
  ["Input", "PDF notes, lecture units, project reports, and written questions."],
  ["Processing", "Chunked document context, chat history, and grounded answer generation."],
  ["Output", "Summaries, explanations, exam prompts, revision plans, and follow-up answers."],
];

const faqs = [
  ["Do I need a PDF to start?", "No. You can begin with general study questions and attach a PDF when you need grounded answers."],
  ["What happens after upload?", "The document is parsed, attached to the current chat, and used as context for later questions."],
  ["Can I manage old chats?", "Yes. The workspace includes saved history, rename controls, delete flows, and account settings."],
  ["Is this only for exams?", "No. It also works for lecture catch-up, project viva prep, assignments, and concept review."],
];

const sampleMessages = [
  ["You", "Summarize unit 3 and list the formulas I should memorize."],
  ["Assistant", "Here is a concise unit summary, followed by formulas grouped by topic."],
  ["You", "Create five exam questions from the same PDF."],
];

const studyModes = ["Summarize", "Explain", "Quiz", "Plan"];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#060913] text-foreground">
      <section className="hero-pattern relative min-h-screen border-b border-white/10">
        <header className="fade-in-up relative z-10 grid w-full grid-cols-[1fr_auto] items-center gap-4 border-b border-white/10 px-5 py-4 sm:px-8 lg:grid-cols-[260px_1fr_auto] lg:px-10">
          <Link href="/" className="group flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg border border-amber-300/25 bg-amber-300/12 text-sm font-black text-amber-200 shadow-[0_0_30px_rgba(240,179,94,0.14)]">
              SA
            </span>
            <span>
              <span className="block text-sm font-semibold text-white">Study Assistant</span>
              <span className="block text-xs text-muted">Focused learning workspace</span>
            </span>
          </Link>

          <nav className="hidden justify-self-start text-sm text-muted lg:flex">
            {["Workflow", "Features", "Outcomes", "FAQ"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(" ", "-")}`}
                className="border-l border-white/10 px-5 transition hover:text-white"
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login" className="btn-secondary px-4 py-2 text-sm">
              Log in
            </Link>
            <Link href="/signup" className="btn-primary px-4 py-2 text-sm">
              Sign up
            </Link>
          </div>
        </header>

        <div className="relative z-10 grid min-h-[calc(100vh-73px)] w-full grid-cols-1 lg:grid-cols-[96px_minmax(0,0.92fr)_minmax(460px,1.08fr)]">
          <aside className="hidden border-r border-white/10 px-5 py-8 lg:flex lg:flex-col lg:justify-between">
            <div className="space-y-4">
              <div className="h-16 w-px bg-amber-300/45" />
              <p className="vertical-rail text-xs font-semibold uppercase tracking-[0.28em] text-amber-100/80">
                Study flow
              </p>
            </div>
            <div className="space-y-3">
              {studyModes.map((mode) => (
                <span
                  key={mode}
                  className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-white/5 text-[10px] font-bold text-slate-300"
                  title={mode}
                >
                  {mode.slice(0, 2)}
                </span>
              ))}
            </div>
          </aside>

          <section className="flex min-w-0 flex-col justify-center border-b border-white/10 px-5 py-12 sm:px-8 lg:border-b-0 lg:border-r lg:px-10 xl:px-14">
            <div className="fade-in-up [animation-delay:80ms]">
              <p className="eyebrow">AI study workspace for PDFs, notes, and revision</p>
              <h1 className="mt-6 text-5xl font-semibold leading-[0.98] text-white sm:text-6xl xl:text-8xl">
                Study from the material you already have.
              </h1>
              <p className="mt-6 max-w-3xl text-base leading-8 text-muted sm:text-lg">
                Upload lecture PDFs, ask focused questions, generate exam practice, and keep
                every session organized inside a clean product workspace.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/signup" className="btn-primary px-5 py-3 text-sm">
                  Start studying
                </Link>
                <Link href="/login" className="btn-secondary px-5 py-3 text-sm">
                  Open existing account
                </Link>
              </div>
            </div>

            <div className="mt-12 grid gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10 sm:grid-cols-2 xl:grid-cols-4">
              {metrics.map(([label, text], index) => (
                <article
                  key={label}
                  className="fade-in-up bg-[#0b111d]/95 p-5"
                  style={{ animationDelay: `${150 + index * 70}ms` }}
                >
                  <p className="text-sm font-semibold text-white">{label}</p>
                  <p className="mt-2 text-sm leading-6 text-muted">{text}</p>
                </article>
              ))}
            </div>
          </section>

          <aside className="relative min-w-0 overflow-hidden px-5 py-8 sm:px-8 lg:px-10 xl:px-14">
            <div className="landing-sweep" />
            <div className="product-frame fade-in-up relative z-10 h-full min-h-[620px] [animation-delay:180ms]">
              <div className="grid h-full grid-rows-[auto_1fr_auto]">
                <div className="flex items-center justify-between border-b border-white/10 p-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-muted">Live product preview</p>
                    <h2 className="mt-2 text-xl font-semibold text-white">Revision dashboard</h2>
                  </div>
                  <span className="rounded-lg border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-medium text-emerald-200">
                    Ready
                  </span>
                </div>

                <div className="grid min-h-0 gap-px bg-white/10 md:grid-cols-[0.72fr_1.28fr]">
                  <div className="bg-[#0c121f] p-4">
                    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                      <p className="text-xs uppercase tracking-[0.28em] text-muted">Chats</p>
                      <div className="mt-4 space-y-2">
                        {["Thermodynamics notes", "DBMS unit review", "Project viva prep", "Exam sprint"].map((item, index) => (
                          <div
                            key={item}
                            className={`rounded-lg border px-3 py-2 text-sm ${
                              index === 0
                                ? "border-amber-300/25 bg-amber-300/10 text-amber-50"
                                : "border-white/8 bg-white/4 text-slate-300"
                            }`}
                          >
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 rounded-lg border border-white/10 bg-black/20 p-3">
                      <p className="text-xs uppercase tracking-[0.28em] text-muted">Modes</p>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {studyModes.map((mode) => (
                          <span key={mode} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
                            {mode}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#0a101b] p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">Thermodynamics notes</p>
                        <p className="text-xs text-muted">PDF attached: unit-3.pdf</p>
                      </div>
                      <span className="rounded-lg bg-white/8 px-2.5 py-1 text-xs text-slate-300">3 messages</span>
                    </div>

                    <div className="space-y-3">
                      {sampleMessages.map(([role, message], index) => (
                        <div
                          key={`${role}-${message}`}
                          className={`max-w-[88%] rounded-lg border px-4 py-3 text-sm leading-6 ${
                            role === "You"
                              ? "ml-auto border-amber-300/25 bg-amber-300/12 text-amber-50"
                              : "border-white/10 bg-[#151c2b] text-slate-100"
                          }`}
                        >
                          <span className="mb-1 block text-xs font-semibold text-white/70">{role}</span>
                          {message}
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      {["Key topics found", "Practice questions ready"].map((item) => (
                        <div key={item} className="rounded-lg border border-white/10 bg-white/5 p-4">
                          <p className="text-xs uppercase tracking-[0.22em] text-muted">{item}</p>
                          <div className="mt-3 h-2 rounded-full bg-white/10">
                            <div className="h-2 w-3/4 rounded-full bg-amber-300" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/10 bg-[#0d1421] p-4">
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/20 px-4 py-3">
                    <span className="text-sm text-slate-400">Ask anything about your PDF...</span>
                    <span className="rounded-lg bg-white px-3 py-1 text-xs font-semibold text-slate-950">Send</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section id="workflow" className="section-band border-b border-white/10">
        <div className="grid w-full lg:grid-cols-[36%_64%]">
          <div className="border-b border-white/10 px-5 py-14 sm:px-8 lg:border-b-0 lg:border-r lg:px-10 xl:px-14">
            <p className="eyebrow">Workflow</p>
            <h2 className="mt-5 text-4xl font-semibold leading-tight text-white lg:text-5xl">
              One uninterrupted path from PDF to revision.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-muted">
              The page now uses the whole browser width: left rail, main story, product preview,
              and full-width section grids all work together.
            </p>
          </div>

          <div className="grid gap-px bg-white/10 sm:grid-cols-2">
            {workflow.map((item) => (
              <article key={item.step} className="bg-[#0b111d] p-6 sm:p-8">
                <span className="inline-grid h-11 w-11 place-items-center rounded-lg bg-amber-300 text-sm font-black text-slate-950">
                  {item.step}
                </span>
                <h3 className="mt-6 text-2xl font-semibold text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="section-band border-b border-white/10">
        <div className="grid w-full xl:grid-cols-[1.05fr_0.95fr]">
          <div className="min-h-[520px] border-b border-white/10 px-5 py-14 sm:px-8 lg:px-10 xl:border-b-0 xl:border-r xl:px-14">
            <p className="eyebrow">Product depth</p>
            <h2 className="mt-5 max-w-4xl text-4xl font-semibold leading-tight text-white lg:text-6xl">
              It behaves like a study product, not a single prompt box.
            </h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {useCases.map((item) => (
                <article key={item.title} className="surface-card p-5">
                  <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted">{item.copy}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="grid gap-px bg-white/10 sm:grid-cols-2">
            {productHighlights.map(([title, description]) => (
              <article key={title} className="bg-[#0b111d] p-6">
                <div className="mb-5 h-1 w-12 rounded-full bg-amber-300" />
                <h3 className="text-xl font-semibold text-white">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="use-cases" className="section-band">
        <div className="grid w-full lg:grid-cols-[1fr_1.2fr]">
          <div className="border-b border-white/10 px-5 py-14 sm:px-8 lg:border-b-0 lg:border-r lg:px-10 xl:px-14">
            <p className="eyebrow">Ready for daily study</p>
            <h2 className="mt-5 text-4xl font-semibold leading-tight text-white lg:text-5xl">
              Start with one PDF. Leave with a clearer plan.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-muted">
              The app supports the full study loop already available in your routes: signup,
              login, upload, ask, chat history, and account management.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/signup" className="btn-primary px-5 py-3 text-sm">
                Create account
              </Link>
              <Link href="/login" className="btn-secondary px-5 py-3 text-sm">
                Continue studying
              </Link>
            </div>
          </div>

          <div className="grid min-h-[420px] gap-px bg-white/10 md:grid-cols-3">
            {metrics.slice(0, 3).map(([label, text], index) => (
              <article key={label} className="flex flex-col justify-between bg-[#0b111d] p-6 sm:p-8">
                <span className="text-sm font-semibold text-amber-200">0{index + 1}</span>
                <div>
                  <h3 className="text-2xl font-semibold text-white">{label}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted">{text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="outcomes" className="section-band border-t border-white/10">
        <div className="grid w-full xl:grid-cols-[0.9fr_1.1fr]">
          <div className="border-b border-white/10 px-5 py-14 sm:px-8 lg:px-10 xl:border-b-0 xl:border-r xl:px-14">
            <p className="eyebrow">Learning outcomes</p>
            <h2 className="mt-5 text-4xl font-semibold leading-tight text-white lg:text-6xl">
              Designed for the messy middle of studying.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-muted">
              Real learning is not one neat prompt. It is rereading, asking again, checking
              examples, and turning weak areas into a plan. The interface is shaped around
              that loop.
            </p>
          </div>

          <div className="grid gap-px bg-white/10 sm:grid-cols-2">
            {outcomes.map(([title, description], index) => (
              <article key={title} className="bg-[#0b111d] p-6 sm:p-8">
                <span className="text-sm font-semibold text-amber-200">Outcome 0{index + 1}</span>
                <h3 className="mt-10 text-2xl font-semibold text-white">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-band border-t border-white/10">
        <div className="grid w-full lg:grid-cols-[1fr_1fr_1fr]">
          {studyStack.map(([title, description], index) => (
            <article
              key={title}
              className="min-h-72 border-b border-white/10 px-5 py-12 sm:px-8 lg:border-b-0 lg:border-r lg:px-10 last:lg:border-r-0"
            >
              <p className="text-sm font-semibold text-amber-200">0{index + 1}</p>
              <h2 className="mt-8 text-3xl font-semibold text-white">{title}</h2>
              <p className="mt-4 max-w-md text-sm leading-7 text-muted">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="faq" className="section-band border-t border-white/10">
        <div className="grid w-full lg:grid-cols-[34%_66%]">
          <div className="border-b border-white/10 px-5 py-14 sm:px-8 lg:border-b-0 lg:border-r lg:px-10 xl:px-14">
            <p className="eyebrow">FAQ</p>
            <h2 className="mt-5 text-4xl font-semibold leading-tight text-white lg:text-5xl">
              Clear answers before users sign in.
            </h2>
          </div>

          <div className="grid gap-px bg-white/10 sm:grid-cols-2">
            {faqs.map(([question, answer]) => (
              <article key={question} className="bg-[#0b111d] p-6 sm:p-8">
                <h3 className="text-xl font-semibold text-white">{question}</h3>
                <p className="mt-4 text-sm leading-7 text-muted">{answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="hero-pattern border-t border-white/10">
        <div className="grid min-h-[520px] w-full lg:grid-cols-[1.15fr_0.85fr]">
          <div className="flex flex-col justify-center border-b border-white/10 px-5 py-14 sm:px-8 lg:border-b-0 lg:border-r lg:px-10 xl:px-14">
            <p className="eyebrow">Start now</p>
            <h2 className="mt-5 max-w-4xl text-5xl font-semibold leading-[1.02] text-white lg:text-7xl">
              Build your next revision session around one useful question.
            </h2>
          </div>
          <div className="flex flex-col justify-center px-5 py-14 sm:px-8 lg:px-10 xl:px-14">
            <p className="text-base leading-8 text-muted">
              Create an account, upload study material, and turn scattered notes into a
              focused workspace for asking, checking, and revising.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/signup" className="btn-primary px-5 py-3 text-sm">
                Create account
              </Link>
              <Link href="/login" className="btn-secondary px-5 py-3 text-sm">
                Log in
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
