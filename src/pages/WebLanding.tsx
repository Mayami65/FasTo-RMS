import { useEffect } from "react";
import logoFull from "@/assets/logo_full.png";
import {
  ArrowRight,
  BadgeCheck,
  Boxes,
  CreditCard,
  Download,
  ShieldCheck,
  Sparkles,
  TimerReset,
  Warehouse,
} from "lucide-react";

const highlights = [
  {
    icon: Warehouse,
    title: "Offline-first retail core",
    text: "SQLite-backed desktop workflows for sales, inventory, customers, and receipts with no server dependency.",
  },
  {
    icon: CreditCard,
    title: "Point-of-sale workflow",
    text: "Fast checkout, held sales, refunds, receipt preview, and thermal printer-friendly output.",
  },
  {
    icon: ShieldCheck,
    title: "Safer updates",
    text: "GitHub Release delivery with automatic update checks and pre-install database backups.",
  },
  {
    icon: Boxes,
    title: "Inventory visibility",
    text: "Products, categories, stock alerts, bulk import, and sales reporting built for daily operations.",
  },
];

const stats = [
  { value: "Electron + Vite", label: "Desktop stack" },
  { value: "SQLite", label: "Local data store" },
  { value: "Auto-updates", label: "GitHub Releases" },
  { value: "POS-ready", label: "Receipt printing" },
];

const roadmap = [
  "Install the desktop app from Releases",
  "Use GitHub Pages as the project showcase",
  "Keep the live system offline-first and local",
];

export default function WebLanding() {
  useEffect(() => {
    document.title = "FasTo RMS | Retail management for desktop teams";
  }, []);

  return (
    <div className="min-h-screen bg-[#0b0d10] text-[#f5f0e8] selection:bg-[#f5b94a] selection:text-[#111]">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(245,185,74,0.18),_transparent_32%),radial-gradient(circle_at_80%_20%,_rgba(255,255,255,0.08),_transparent_24%),linear-gradient(135deg,_rgba(255,255,255,0.03),_transparent_45%)]" />
        <div className="absolute inset-0 opacity-[0.15] [background-image:linear-gradient(rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:72px_72px]" />

        <main className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8 lg:px-10">
          <header className="flex flex-col gap-6 border-b border-white/10 pb-8 md:flex-row md:items-end md:justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-3 shadow-2xl shadow-black/30 backdrop-blur">
                <img src={logoFull} alt="FasTo RMS" className="h-12 w-auto" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-[#f5b94a]">
                  Retail management system
                </p>
                <h1 className="mt-1 font-serif text-3xl tracking-tight text-white md:text-4xl">
                  FasTo RMS
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 text-xs font-bold uppercase tracking-[0.25em] text-white/65">
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                Desktop app
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                Project showcase
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                GitHub Pages
              </span>
            </div>
          </header>

          <section className="grid flex-1 gap-8 py-12 lg:grid-cols-[1.3fr_0.7fr] lg:items-center lg:py-16">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#f5b94a]/20 bg-[#f5b94a]/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.35em] text-[#f5d38b]">
                <Sparkles className="h-3.5 w-3.5" />
                Built for retail teams that stay offline
              </div>

              <div className="space-y-5">
                <h2 className="max-w-3xl font-serif text-5xl leading-none tracking-tight text-white md:text-7xl">
                  A desktop retail system with the discipline of a register and
                  the clarity of a dashboard.
                </h2>
                <p className="max-w-2xl text-base leading-7 text-white/72 md:text-lg">
                  FasTo RMS is a local-first business application for point of
                  sale, inventory, customer management, hire purchase, refunds,
                  and reporting. GitHub Pages hosts the product story; the
                  Electron app handles the actual operations.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <a
                  href="https://github.com/Mayami65/FasTo-RMS/releases"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-[#f5b94a] px-6 py-3 text-sm font-black text-[#131313] transition-transform duration-200 hover:-translate-y-0.5"
                >
                  <Download className="h-4 w-4" />
                  Download release
                </a>
                <a
                  href="https://github.com/Mayami65/FasTo-RMS"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-black text-white transition-colors hover:bg-white/10"
                >
                  View source
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/20 backdrop-blur-sm"
                  >
                    <p className="font-serif text-2xl text-white">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.25em] text-white/55">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 rounded-[2rem] bg-[#f5b94a]/20 blur-3xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#101319]/90 p-6 shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white/45">
                      Operational focus
                    </p>
                    <h3 className="mt-2 font-serif text-2xl text-white">
                      What the system covers
                    </h3>
                  </div>
                  <TimerReset className="h-9 w-9 text-[#f5b94a]" />
                </div>

                <div className="mt-6 space-y-4">
                  {highlights.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.title}
                        className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 transition-transform duration-300 hover:-translate-y-0.5"
                        style={{ animationDelay: `${index * 120}ms` }}
                      >
                        <div className="flex items-start gap-4">
                          <div className="rounded-2xl border border-[#f5b94a]/20 bg-[#f5b94a]/10 p-3 text-[#f5b94a]">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-white">
                              {item.title}
                            </h4>
                            <p className="mt-1 text-sm leading-6 text-white/65">
                              {item.text}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 rounded-2xl border border-[#f5b94a]/15 bg-[#f5b94a]/10 p-4">
                  <div className="flex items-center gap-2 text-[#f5d38b]">
                    <BadgeCheck className="h-4 w-4" />
                    <p className="text-[11px] font-black uppercase tracking-[0.3em]">
                      GitHub Pages note
                    </p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-white/75">
                    This Pages site is the project showcase. The full retail
                    workflow stays in the Electron desktop app, which uses
                    SQLite and local device APIs.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 border-t border-white/10 py-10 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-lg shadow-black/20">
              <p className="text-[11px] font-black uppercase tracking-[0.35em] text-[#f5b94a]">
                Deployment path
              </p>
              <h3 className="mt-2 font-serif text-3xl text-white">
                GitHub Pages for discovery, Electron for operations
              </h3>
              <div className="mt-6 grid gap-3 md:grid-cols-3">
                {roadmap.map((step, index) => (
                  <div
                    key={step}
                    className="rounded-2xl border border-white/10 bg-[#0f1217] p-4"
                  >
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/35">
                      0{index + 1}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-white/75">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-[#f5b94a] p-6 text-[#101010] shadow-lg shadow-black/20">
              <p className="text-[10px] font-black uppercase tracking-[0.35em] opacity-70">
                Quick start
              </p>
              <p className="mt-3 font-serif text-3xl leading-tight">
                Run locally with `npm start`.
              </p>
              <p className="mt-3 text-sm leading-6 opacity-80">
                For the desktop workflow, install dependencies and launch the
                Electron runtime. Pages only shows the project overview.
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
