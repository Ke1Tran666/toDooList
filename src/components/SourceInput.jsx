import { FolderSearch, GitBranch } from "lucide-react";
import { formatSourceKind } from "../lib/format";

export function SourceInput({
  source,
  sourceKind,
  language,
  placeholder,
  onSourceChange,
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white/95 p-3 shadow-[0_16px_40px_rgba(38,53,77,0.08)] dark:border-slate-700 dark:bg-slate-900/95 dark:shadow-[0_16px_40px_rgba(0,0,0,0.26)]">
      <div className="grid grid-cols-[38px_1fr_auto] items-center overflow-hidden rounded-[7px] border border-slate-300 bg-white transition focus-within:border-teal-700 focus-within:ring-4 focus-within:ring-teal-700/10 max-sm:grid-cols-[38px_minmax(0,1fr)] dark:border-slate-700 dark:bg-slate-950 dark:focus-within:border-teal-400 dark:focus-within:ring-teal-400/10">
        <div className="grid h-[42px] place-items-center bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
          {sourceKind === "github" ? (
            <GitBranch size={18} />
          ) : (
            <FolderSearch size={18} />
          )}
        </div>
        <input
          className="h-[42px] min-w-0 border-0 bg-transparent px-3 text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
          value={source}
          onChange={(event) => onSourceChange(event.target.value)}
          placeholder={placeholder}
        />
        <span className={sourceChipClass(sourceKind)}>
          {formatSourceKind(sourceKind, language)}
        </span>
      </div>
    </section>
  );
}

function sourceChipClass(sourceKind) {
  const base =
    "mr-2 min-w-[72px] rounded-full px-2.5 py-1 text-center text-xs font-bold uppercase max-sm:col-span-full max-sm:mb-2 max-sm:ml-2 max-sm:mr-0 max-sm:justify-self-start";

  if (sourceKind === "github") {
    return `${base} bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200`;
  }

  if (sourceKind === "local" || sourceKind === "file") {
    return `${base} bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200`;
  }

  return `${base} bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300`;
}

