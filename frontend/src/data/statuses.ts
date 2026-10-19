export const DIVISION_STATUSES: Record<string, string[]> = {
  Executive: ["📊 Review OKR Kantor", "💼 Meeting Investor", "📈 Analisis KPI", "🤝 Partner Call"],
  Technology: ["🐛 Fixing Bug", "🔀 Review Pull Request", "🚀 Deploy Backend", "🎨 Slicing UI", "⚙️ Refactoring Code"],
  "Data & AI": ["🤖 Training Model", "🧹 Cleaning Dataset", "🧪 Prompt Tuning", "🔍 Querying DB"],
  Marketing: ["🎬 Bikin Konten", "📊 Cek Campaign Ads", "✍️ Drafting Copy", "📈 Analisis Analytics"],
  Operations: ["👤 Interview Lead", "💵 Review Payroll", "📋 Update SOP", "📜 Audit Legal"],
  Product: ["📌 Sprint Planning", "📝 Backlog Grooming", "💡 User Research", "📑 Drafting PRD"],
};

export function getRandomStatus(division: string): string {
  const list = DIVISION_STATUSES[division] || ["☕ Rehat Sejenak", "💻 Kerja Fokus"];
  return list[Math.floor(Math.random() * list.length)];
}