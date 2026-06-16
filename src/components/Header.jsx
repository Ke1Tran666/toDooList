import { RefreshCw, Settings, Sparkles, Wand2 } from "lucide-react";
import { iconButtonClass } from "../lib/ui";

export function Header({
  t,
  source,
  isAnalyzing,
  onAnalyze,
  onOpenSettings,
}) {
  return (
    <header className="flex min-h-[72px] items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white/95 px-4 py-3.5 shadow-[0_16px_40px_rgba(38,53,77,0.08)] max-sm:flex-col max-sm:items-stretch dark:border-slate-700 dark:bg-slate-900/95 dark:shadow-[0_16px_40px_rgba(0,0,0,0.26)]">
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-lg bg-teal-900 font-extrabold text-white dark:bg-teal-600">
          TD
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold leading-tight">toDooList</h1>
          <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
            {t.subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 max-sm:items-stretch">
        <button
          className={iconButtonClass}
          title={t.settings}
          aria-label={t.settings}
          onClick={onOpenSettings}
        >
          <Settings size={18} />
        </button>
        <button
          className={iconButtonClass}
          title={t.refreshAnalysis}
          aria-label={t.refreshAnalysis}
          onClick={onAnalyze}
          disabled={isAnalyzing || !source.trim()}
        >
          <RefreshCw size={18} />
        </button>
        <button
          className="inline-flex min-h-[38px] items-center justify-center gap-2 rounded-[7px] border border-transparent bg-teal-700 px-4 text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60 max-sm:flex-1 dark:bg-teal-600 dark:hover:bg-teal-500"
          onClick={onAnalyze}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? <Sparkles size={18} /> : <Wand2 size={18} />}
          <span>{isAnalyzing ? t.analyzing : t.analyze}</span>
        </button>
      </div>
    </header>
  );
}

