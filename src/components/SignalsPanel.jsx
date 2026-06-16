import { ClipboardList } from "lucide-react";
import { panelClass } from "../lib/ui";

export function SignalsPanel({ t, stats }) {
  const topLanguages = stats.languages.slice(0, 5);

  return (
    <section className={panelClass}>
      <div className="mb-3 flex items-center gap-2 text-slate-700 dark:text-slate-200">
        <ClipboardList size={18} />
        <h2 className="text-[15px] font-bold">{t.signals}</h2>
      </div>
      <div className="grid gap-2">
        <StatRow label={t.files} value={stats.filesScanned} />
        <StatRow label={t.folders} value={stats.directoriesScanned} />
        <StatRow label={t.markers} value={stats.todoMarkers} />

        <div className="mt-1 flex flex-wrap gap-1.5">
          {stats.signals.map((signal) => (
            <span
              className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
              key={signal}
            >
              {signal}
            </span>
          ))}
        </div>

        <div className="mt-0.5 grid gap-2 border-t border-slate-200 pt-2.5 dark:border-slate-700">
          {topLanguages.map((languageItem) => (
            <StatRow
              key={languageItem.name}
              label={languageItem.name}
              value={languageItem.files}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function StatRow({ label, value }) {
  return (
    <div className="flex justify-between gap-2.5 text-[13px] text-slate-500 dark:text-slate-400">
      <span>{label}</span>
      <strong className="text-slate-900 dark:text-slate-100">{value}</strong>
    </div>
  );
}

