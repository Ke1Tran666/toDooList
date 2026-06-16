import { Link2 } from "lucide-react";
import { formatSourceKind } from "../lib/format";
import { panelClass } from "../lib/ui";

export function SourcePanel({
  t,
  language,
  sourceType,
  sourceLabel,
  selectedCount,
}) {
  return (
    <section className={panelClass}>
      <div className="mb-3 flex items-center gap-2 text-slate-700 dark:text-slate-200">
        <Link2 size={18} />
        <h2 className="text-[15px] font-bold">{t.source}</h2>
      </div>
      <dl className="grid gap-2.5">
        <MetaItem label={t.type} value={formatSourceKind(sourceType, language)} />
        <MetaItem label={t.path} value={sourceLabel ?? t.notAnalyzed} />
        <MetaItem label={t.selected} value={`${selectedCount} ${t.tasksUnit}`} />
      </dl>
    </section>
  );
}

function MetaItem({ label, value }) {
  return (
    <div className="grid gap-1">
      <dt className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
        {label}
      </dt>
      <dd className="m-0 text-sm text-slate-700 [overflow-wrap:anywhere] dark:text-slate-200">
        {value}
      </dd>
    </div>
  );
}

